"""Unit and integration tests for Global Fleet Optimization Engine (Hungarian Algorithm)."""

import uuid

from fastapi.testclient import TestClient

from app.ml.fleet_optimizer import optimize_fleet_dispatch
from app.models.enums import IncidentType, ResourceType, Severity


def test_optimize_fleet_empty():
    res = optimize_fleet_dispatch([], [])
    assert res["metrics"]["incidents_assigned"] == 0
    assert len(res["assignments"]) == 0
    assert len(res["bottlenecks"]) == 0


def test_optimize_fleet_hungarian_matching():
    incidents = [
        {
            "id": uuid.uuid4(),
            "title": "Commercial Fire",
            "incident_type": IncidentType.FIRE,
            "severity": Severity.CRITICAL,
            "priority": 1,
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
        {
            "id": uuid.uuid4(),
            "title": "Road Accident",
            "incident_type": IncidentType.ROAD_ACCIDENT,
            "severity": Severity.MEDIUM,
            "priority": 3,
            "latitude": 12.9352,
            "longitude": 77.6245,
        },
    ]

    resources = [
        {
            "id": uuid.uuid4(),
            "name": "Fire Engine 1",
            "resource_type": ResourceType.VEHICLE,
            "capability": "fire",
            "latitude": 12.9720,
            "longitude": 77.5950,
        },
        {
            "id": uuid.uuid4(),
            "name": "Ambulance 5",
            "resource_type": ResourceType.VEHICLE,
            "capability": "trauma",
            "latitude": 12.9360,
            "longitude": 77.6250,
        },
    ]

    res = optimize_fleet_dispatch(incidents, resources)
    assert res["metrics"]["incidents_assigned"] == 2
    assert len(res["assignments"]) == 2
    assert res["metrics"]["unassigned_bottlenecks"] == 0

    # Ensure each incident and resource was assigned exactly once
    assigned_inc_ids = {a["incident_id"] for a in res["assignments"]}
    assigned_unit_ids = {a["unit_id"] for a in res["assignments"]}
    assert len(assigned_inc_ids) == 2
    assert len(assigned_unit_ids) == 2


def test_urgency_priority_weighting():
    # Critical incident vs Low incident competing for close unit
    # Resource A is close to both (12.9716, 77.5946)
    # Resource B is far from both (13.0500, 77.5946)
    inc_crit = {
        "id": uuid.uuid4(),
        "title": "Chemical Explosion",
        "incident_type": IncidentType.INDUSTRIAL_ACCIDENT,
        "severity": Severity.CRITICAL,
        "priority": 1,
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    inc_low = {
        "id": uuid.uuid4(),
        "title": "Minor Road Scratch",
        "incident_type": IncidentType.OTHER,
        "severity": Severity.LOW,
        "priority": 4,
        "latitude": 12.9718,
        "longitude": 77.5948,
    }
    close_unit = {
        "id": uuid.uuid4(),
        "name": "Fast Ambulance Alpha",
        "resource_type": ResourceType.VEHICLE,
        "capability": "paramedic",
        "latitude": 12.9717,
        "longitude": 77.5947,
    }
    far_unit = {
        "id": uuid.uuid4(),
        "name": "Distant Backup Unit",
        "resource_type": ResourceType.VEHICLE,
        "capability": "general",
        "latitude": 13.0800,
        "longitude": 77.5947,
    }

    res = optimize_fleet_dispatch([inc_crit, inc_low], [close_unit, far_unit])
    assignments = {a["incident_id"]: a for a in res["assignments"]}

    # The Critical incident MUST be awarded the closest unit
    assert assignments[inc_crit["id"]]["unit_id"] == close_unit["id"]
    assert assignments[inc_low["id"]]["unit_id"] == far_unit["id"]


def test_unbalanced_scarcity_bottlenecks():
    incidents = [
        {
            "id": uuid.uuid4(),
            "title": "Incident 1",
            "incident_type": IncidentType.FIRE,
            "severity": Severity.HIGH,
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
        {
            "id": uuid.uuid4(),
            "title": "Incident 2",
            "incident_type": IncidentType.FLOOD,
            "severity": Severity.HIGH,
            "latitude": 12.9800,
            "longitude": 77.6000,
        },
    ]
    # Only 1 resource available
    resources = [
        {
            "id": uuid.uuid4(),
            "name": "Solo Engine",
            "resource_type": ResourceType.VEHICLE,
            "latitude": 12.9716,
            "longitude": 77.5946,
        }
    ]

    res = optimize_fleet_dispatch(incidents, resources)
    assert res["metrics"]["incidents_assigned"] == 1
    assert res["metrics"]["unassigned_bottlenecks"] == 1
    assert len(res["bottlenecks"]) == 1
    assert "missing_capability" in res["bottlenecks"][0]


def test_optimize_fleet_api_endpoint(client: TestClient):
    # Seed 1 active incident and 1 available resource via API
    client.post(
        "/incidents",
        json={
            "title": "Downtown Fire",
            "source": "citizen_report",
            "incident_type": "fire",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
    )

    resp = client.post("/resources/optimize-fleet")
    assert resp.status_code == 200
    data = resp.json()
    assert "plan_id" in data
    assert "metrics" in data
    assert "Hungarian" in data["algorithm"]
