"""Global Fleet Optimization Engine.

Solves the Mass-Casualty Resource Scarcity Dilemma using Operations Research
and the Hungarian Bipartite Minimum-Cost Matching Algorithm (scipy.optimize.linear_sum_assignment).
"""

import datetime
import uuid
from typing import Any

import numpy as np
from scipy.optimize import linear_sum_assignment

from app.ml.resource_matching import estimate_eta_minutes
from app.models.enums import IncidentType, ResourceType, Severity

_SEVERITY_URGENCY_WEIGHT: dict[Severity, float] = {
    Severity.CRITICAL: 5.0,
    Severity.HIGH: 3.0,
    Severity.MEDIUM: 1.8,
    Severity.LOW: 1.0,
}

_INCIDENT_TYPE_RESOURCE_AFFINITY: dict[IncidentType, set[ResourceType]] = {
    IncidentType.FIRE: {ResourceType.VEHICLE, ResourceType.TEAM, ResourceType.EQUIPMENT},
    IncidentType.INDUSTRIAL_ACCIDENT: {ResourceType.TEAM, ResourceType.VEHICLE, ResourceType.EQUIPMENT},
    IncidentType.FLOOD: {ResourceType.TEAM, ResourceType.EQUIPMENT, ResourceType.VEHICLE},
    IncidentType.ROAD_ACCIDENT: {ResourceType.VEHICLE, ResourceType.TEAM},
    IncidentType.MEDICAL: {ResourceType.VEHICLE, ResourceType.TEAM},
    IncidentType.OTHER: {ResourceType.TEAM, ResourceType.VEHICLE},
}


def _capability_penalty(
    inc_type: IncidentType, res_type: ResourceType, capability: str | None = None
) -> float:
    """Calculate penalty if resource capability is mismatched with incident requirements."""
    preferred = _INCIDENT_TYPE_RESOURCE_AFFINITY.get(inc_type, set())
    penalty = 0.0 if res_type in preferred else 18.0

    if capability and inc_type.value.lower() in capability.lower():
        penalty -= 5.0

    return max(0.0, penalty)


def optimize_fleet_dispatch(
    incidents: list[dict[str, Any]],
    resources: list[dict[str, Any]],
) -> dict[str, Any]:
    """Execute global bipartite matching between active incidents and available resources.

    Returns the globally optimal assignment plan, comparison metrics against naive greedy dispatch,
    and unserviced sector bottlenecks.
    """
    timestamp = datetime.datetime.now(datetime.UTC).isoformat()
    plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"

    if not incidents or not resources:
        return {
            "plan_id": plan_id,
            "timestamp": timestamp,
            "algorithm": "Hungarian Bipartite Minimum-Cost Matching (scipy.optimize.linear_sum_assignment)",
            "metrics": {
                "total_optimized_eta_minutes": 0.0,
                "total_greedy_eta_minutes": 0.0,
                "time_saved_minutes": 0.0,
                "efficiency_gain_pct": 0.0,
                "incidents_assigned": 0,
                "unassigned_bottlenecks": len(incidents),
            },
            "assignments": [],
            "bottlenecks": [
                {
                    "incident_id": inc["id"],
                    "incident_title": inc.get("title", "Emergency Incident"),
                    "incident_type": inc["incident_type"],
                    "severity": inc["severity"],
                    "missing_capability": "No available resource units in city fleet",
                    "recommendation": "Request emergency mutual aid from neighboring municipal districts.",
                }
                for inc in incidents
            ],
        }

    m = len(incidents)
    n = len(resources)

    # 1. Construct Cost Matrix C of size (m x n)
    cost_matrix = np.zeros((m, n), dtype=float)
    eta_matrix = np.zeros((m, n), dtype=float)

    for i, inc in enumerate(incidents):
        i_lat = inc.get("latitude")
        i_lon = inc.get("longitude")
        sev = inc.get("severity", Severity.MEDIUM)
        inc_type = inc.get("incident_type", IncidentType.OTHER)
        weight = _SEVERITY_URGENCY_WEIGHT.get(sev, 2.0)

        for j, res in enumerate(resources):
            r_lat = res.get("latitude")
            r_lon = res.get("longitude")
            res_type = res.get("resource_type", ResourceType.VEHICLE)
            cap = res.get("capability")

            eta_val = estimate_eta_minutes(i_lat, i_lon, r_lat, r_lon)
            eta = 15.0 if eta_val is None else eta_val
            eta_matrix[i, j] = eta

            mismatch = _capability_penalty(inc_type, res_type, cap)

            # High urgency incidents heavily penalize delayed ETAs
            cost_matrix[i, j] = (eta * weight) + mismatch

    # 2. Solve global optimal matching using the Hungarian Algorithm
    row_ind, col_ind = linear_sum_assignment(cost_matrix)

    assigned_incident_indices = set(row_ind)
    optimal_assignments = []
    total_opt_eta = 0.0

    for r_idx, c_idx in zip(row_ind, col_ind, strict=False):
        inc = incidents[r_idx]
        res = resources[c_idx]
        eta = round(float(eta_matrix[r_idx, c_idx]), 1)
        total_opt_eta += eta
        cost_score = round(float(cost_matrix[r_idx, c_idx]), 1)

        optimal_assignments.append(
            {
                "incident_id": inc["id"],
                "incident_title": inc.get("title", "Emergency Incident"),
                "incident_type": inc["incident_type"],
                "severity": inc["severity"],
                "priority": inc.get("priority", 1),
                "unit_id": res["id"],
                "unit_name": res["name"],
                "resource_type": res["resource_type"],
                "capability": res.get("capability"),
                "eta_minutes": eta,
                "urgency_cost_score": cost_score,
            }
        )

    # 3. Simulate Naive Greedy Baseline (first-come, first-served greedy nearest)
    remaining_res_indices = set(range(n))
    total_greedy_eta = 0.0

    # Sort incidents chronologically or arbitrarily to simulate standard arrival queue
    arrival_order = sorted(range(m), key=lambda idx: incidents[idx].get("created_at", str(idx)))

    for i_idx in arrival_order:
        if not remaining_res_indices:
            break
        # Pick the nearest available resource purely by raw distance/ETA
        best_r = min(remaining_res_indices, key=lambda j_idx: eta_matrix[i_idx, j_idx])
        remaining_res_indices.remove(best_r)
        total_greedy_eta += float(eta_matrix[i_idx, best_r])

    # 4. Calculate Efficiency & Time-Saved Metrics
    time_saved = max(0.0, round(total_greedy_eta - total_opt_eta, 1))
    gain_pct = round((time_saved / total_greedy_eta) * 100.0, 1) if total_greedy_eta > 0 else 0.0

    # 5. Identify Unserviced Bottlenecks
    bottlenecks = []
    for i, inc in enumerate(incidents):
        if i not in assigned_incident_indices:
            bottlenecks.append(
                {
                    "incident_id": inc["id"],
                    "incident_title": inc.get("title", "Emergency Incident"),
                    "incident_type": inc["incident_type"],
                    "severity": inc["severity"],
                    "missing_capability": (
                        f"Fleet exhausted. Requires additional {inc['incident_type'].value} units"
                    ),
                    "recommendation": (
                        "Dispatch reserve units from regional headquarters or request mutual aid."
                    ),
                }
            )

    return {
        "plan_id": plan_id,
        "timestamp": timestamp,
        "algorithm": "Hungarian Bipartite Minimum-Cost Matching (scipy.optimize.linear_sum_assignment)",
        "metrics": {
            "total_optimized_eta_minutes": round(total_opt_eta, 1),
            "total_greedy_eta_minutes": round(total_greedy_eta, 1),
            "time_saved_minutes": time_saved,
            "efficiency_gain_pct": gain_pct,
            "incidents_assigned": len(optimal_assignments),
            "unassigned_bottlenecks": len(bottlenecks),
        },
        "assignments": optimal_assignments,
        "bottlenecks": bottlenecks,
    }
