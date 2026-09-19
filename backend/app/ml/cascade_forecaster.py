"""Predictive Incident Cascade & Secondary Hazard Forecaster.

Models atmospheric downwind dispersion vectors, predicts secondary disaster cascade timelines,
and evaluates vulnerable infrastructure threats (schools, transit hubs, substations).
"""

import json
import math
from pathlib import Path
from typing import Any

from app.models.enums import IncidentType, Severity

BASE_DIR = Path(__file__).resolve().parent
CANDIDATE_PATHS = [
    BASE_DIR / "data" / "facilities" / "infrastructure.json",
    BASE_DIR.parent / "data" / "facilities" / "infrastructure.json",
    BASE_DIR.parents[2] / "data" / "facilities" / "infrastructure.json",
]


def _load_infrastructure() -> list[dict[str, Any]]:
    for path in CANDIDATE_PATHS:
        if path.exists():
            with open(path, encoding="utf-8") as f:
                return json.load(f)
    return []


def _geodesic_offset(lat: float, lon: float, distance_m: float, bearing_deg: float) -> list[float]:
    """Calculate target latitude and longitude given distance in meters and compass bearing."""
    rad_bearing = math.radians(bearing_deg)
    rad_lat = math.radians(lat)

    # 1 deg latitude ~ 111,139 meters
    # 1 deg longitude ~ 111,139 * cos(lat) meters
    delta_lat = (distance_m * math.cos(rad_bearing)) / 111139.0
    delta_lon = (distance_m * math.sin(rad_bearing)) / (111139.0 * math.cos(rad_lat))

    return [round(lat + delta_lat, 6), round(lon + delta_lon, 6)]


def compute_plume_polygon(
    lat: float,
    lon: float,
    wind_direction_deg: float,
    wind_speed_kmh: float,
    base_radius_m: float = 200.0,
) -> list[list[float]]:
    """Compute an atmospheric dispersion cone polygon oriented downwind.

    The cone models Pasquill-Gifford dispersion where the hazard plumes downwind
    with an angular lateral spread (approx +/- 30 degrees) and an upwind buffer.
    """
    downwind_length_m = base_radius_m + (wind_speed_kmh * 30.0)
    spread_angle = 32.0  # degrees lateral dispersion

    vertices: list[list[float]] = []

    # 1. Upwind safety buffer (circular arc facing opposite of wind direction)
    upwind_center_deg = (wind_direction_deg + 180.0) % 360.0
    for offset_angle in range(-90, 91, 30):
        bearing = (upwind_center_deg + offset_angle) % 360.0
        vertices.append(_geodesic_offset(lat, lon, base_radius_m * 0.65, bearing))

    # 2. Downwind right flank
    right_bearing = (wind_direction_deg - spread_angle) % 360.0
    vertices.append(_geodesic_offset(lat, lon, downwind_length_m * 0.75, right_bearing))

    # 3. Downwind apex (plume head)
    vertices.append(_geodesic_offset(lat, lon, downwind_length_m, wind_direction_deg))

    # 4. Downwind left flank
    left_bearing = (wind_direction_deg + spread_angle) % 360.0
    vertices.append(_geodesic_offset(lat, lon, downwind_length_m * 0.75, left_bearing))

    # Close the polygon
    if vertices:
        vertices.append(vertices[0])

    return vertices


def predict_secondary_hazards(
    incident_type: IncidentType,
    severity: Severity,
    wind_speed_kmh: float,
) -> list[dict[str, Any]]:
    """Predict secondary hazard triggers, probabilities, and onset timelines."""
    is_crit = severity == Severity.CRITICAL
    is_high = severity in (Severity.HIGH, Severity.CRITICAL)

    hazards = []

    if incident_type == IncidentType.FIRE:
        hazards.append(
            {
                "hazard_type": "Flashover & Adjacent Structure Ignition",
                "probability": 0.85 if is_crit else (0.65 if is_high else 0.35),
                "estimated_onset_minutes": 15 if is_crit else 25,
                "severity_impact": "high",
                "recommended_action": "Establish cooling water curtain on downwind exposures immediately.",
            }
        )
        hazards.append(
            {
                "hazard_type": "Dense Toxic Smoke & CO Plume Dispersion",
                "probability": min(0.95, 0.50 + (wind_speed_kmh * 0.02)),
                "estimated_onset_minutes": 10,
                "severity_impact": "critical" if is_high else "medium",
                "recommended_action": "Issue residential stay-indoors / N95 advisory downwind.",
            }
        )
        if is_high:
            hazards.append(
                {
                    "hazard_type": "Structural Roof Collapse & Thermal Weakening",
                    "probability": 0.72 if is_crit else 0.48,
                    "estimated_onset_minutes": 35,
                    "severity_impact": "critical",
                    "recommended_action": (
                        "Enforce strict external-only defensive perimeter for interior attack teams."
                    ),
                }
            )

    elif incident_type == IncidentType.INDUSTRIAL_ACCIDENT:
        hazards.append(
            {
                "hazard_type": "Chemical Vapor Cloud Dispersion (Toxic Gas / VOC)",
                "probability": 0.90 if is_high else 0.60,
                "estimated_onset_minutes": 8,
                "severity_impact": "critical",
                "recommended_action": "Activate reverse-911 evacuation corridor 500m downwind.",
            }
        )
        hazards.append(
            {
                "hazard_type": "Secondary Pressure Vessel Rupture / BLEVE",
                "probability": 0.58 if is_crit else 0.28,
                "estimated_onset_minutes": 20,
                "severity_impact": "critical",
                "recommended_action": "Establish 300m unmanned monitor nozzle cooling on pressurized tanks.",
            }
        )
        hazards.append(
            {
                "hazard_type": "Stormwater Runoff Chemical Contamination",
                "probability": 0.74,
                "estimated_onset_minutes": 45,
                "severity_impact": "high",
                "recommended_action": "Deploy absorbent booms at storm drain outfalls.",
            }
        )

    elif incident_type == IncidentType.FLOOD:
        hazards.append(
            {
                "hazard_type": "Substation Power Inundation & Electrocution Hazard",
                "probability": 0.82 if is_high else 0.45,
                "estimated_onset_minutes": 30,
                "severity_impact": "critical",
                "recommended_action": (
                    "Coordinate with municipal electric utility for grid sector de-energization."
                ),
            }
        )
        hazards.append(
            {
                "hazard_type": "Drainage Backflow & Sewage Contamination",
                "probability": 0.78,
                "estimated_onset_minutes": 60,
                "severity_impact": "medium",
                "recommended_action": "Dispatch water rescue boats with prophylactic medical kits.",
            }
        )

    elif incident_type == IncidentType.ROAD_ACCIDENT:
        hazards.append(
            {
                "hazard_type": "Secondary Highway Pileup in Reduced Visibility",
                "probability": 0.68 if is_high else 0.40,
                "estimated_onset_minutes": 10,
                "severity_impact": "high",
                "recommended_action": "Deploy road flare barrier and variable message sign 1.5km upstream.",
            }
        )
        hazards.append(
            {
                "hazard_type": "Fuel Tank Ignition & Highway Surface Degradation",
                "probability": 0.42 if is_high else 0.20,
                "estimated_onset_minutes": 20,
                "severity_impact": "medium",
                "recommended_action": "Apply Class B foam blanket over spilled fuel footprint.",
            }
        )

    else:
        hazards.append(
            {
                "hazard_type": "Local Crowd Congestion & First Responder Blockade",
                "probability": 0.65,
                "estimated_onset_minutes": 15,
                "severity_impact": "medium",
                "recommended_action": "Establish traffic perimeter with local law enforcement.",
            }
        )

    return hazards


def evaluate_infrastructure(
    inc_lat: float,
    inc_lon: float,
    max_scan_km: float = 5.0,
) -> list[dict[str, Any]]:
    """Scan civic infrastructure within impact perimeter."""
    all_infra = _load_infrastructure()
    matched = []

    for item in all_infra:
        i_lat = item.get("latitude")
        i_lon = item.get("longitude")
        if i_lat is None or i_lon is None:
            continue

        # Approximate euclidean distance in km
        d_lat = (i_lat - inc_lat) * 111.139
        d_lon = (i_lon - inc_lon) * 111.139 * math.cos(math.radians(inc_lat))
        dist_km = math.sqrt(d_lat * d_lat + d_lon * d_lon)

        if dist_km <= max_scan_km:
            matched.append(
                {
                    "id": item["id"],
                    "name": item["name"],
                    "category": item["category"],
                    "distance_km": round(dist_km, 2),
                    "inside_plume": dist_km <= 1.5,
                    "occupancy_estimate": item.get("occupancy_estimate", 500),
                }
            )

    matched.sort(key=lambda x: x["distance_km"])
    return matched[:5]


def forecast_cascade_risk(
    incident_type: IncidentType,
    severity: Severity,
    priority: int,
    inc_lat: float,
    inc_lon: float,
    wind_speed_kmh: float = 15.0,
    wind_direction_deg: float = 45.0,
    temperature_c: float = 28.0,
    humidity_pct: float = 65.0,
) -> dict[str, Any]:
    """Forecast comprehensive cascade risk, dispersion plume, and secondary hazard threats."""
    base_radius = 350.0 if severity == Severity.CRITICAL else (250.0 if severity == Severity.HIGH else 150.0)

    # 1. Compute dynamic plume cone
    plume_coords = compute_plume_polygon(
        lat=inc_lat,
        lon=inc_lon,
        wind_direction_deg=wind_direction_deg,
        wind_speed_kmh=wind_speed_kmh,
        base_radius_m=base_radius,
    )
    downwind_len = base_radius + (wind_speed_kmh * 30.0)

    # 2. Predict secondary hazards
    sec_hazards = predict_secondary_hazards(incident_type, severity, wind_speed_kmh)

    # 3. Assess infrastructure
    infra_threats = evaluate_infrastructure(inc_lat, inc_lon, max_scan_km=4.0)

    # 4. Calculate composite cascade risk score (0 - 100)
    sev_weights = {
        Severity.LOW: 25.0,
        Severity.MEDIUM: 45.0,
        Severity.HIGH: 70.0,
        Severity.CRITICAL: 88.0,
    }
    base_score = sev_weights.get(severity, 50.0)
    wind_bonus = min(12.0, wind_speed_kmh * 0.4)
    infra_bonus = min(10.0, len(infra_threats) * 2.5)

    risk_score = min(98.5, round(base_score + wind_bonus + infra_bonus, 1))

    if risk_score >= 80.0:
        esc_level = "critical"
        advice = (
            f"High probability of multi-front cascade. Evacuate {int(downwind_len)}m "
            f"downwind ({int(wind_direction_deg)}°) sector immediately."
        )
    elif risk_score >= 60.0:
        esc_level = "high"
        advice = (
            "Substantial secondary hazard risk. Secure perimeter and establish defensive barriers downwind."
        )
    elif risk_score >= 40.0:
        esc_level = "medium"
        advice = "Moderate cascade risk. Monitor atmospheric sensors and maintain staging buffer."
    else:
        esc_level = "low"
        advice = "Minimal cascade escalation risk. Standard sector containment sufficient."

    return {
        "cascade_risk_score": risk_score,
        "escalation_level": esc_level,
        "weather": {
            "wind_speed_kmh": wind_speed_kmh,
            "wind_direction_deg": wind_direction_deg,
            "temperature_c": temperature_c,
            "humidity_pct": humidity_pct,
        },
        "secondary_hazards": sec_hazards,
        "evacuation_corridor": {
            "hazard_radius_meters": base_radius,
            "downwind_length_meters": downwind_len,
            "wind_direction_deg": wind_direction_deg,
            "polygon_coordinates": plume_coords,
        },
        "vulnerable_infrastructure": infra_threats,
        "tactical_evacuation_advice": advice,
    }
