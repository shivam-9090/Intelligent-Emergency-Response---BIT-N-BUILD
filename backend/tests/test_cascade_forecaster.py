"""Unit and integration tests for Predictive Cascade Risk & Plume Forecaster."""

import uuid

from fastapi.testclient import TestClient

from app.ml.cascade_forecaster import (
    compute_plume_polygon,
    forecast_cascade_risk,
    predict_secondary_hazards,
)
from app.models.enums import IncidentType, Severity


def test_compute_plume_polygon_geometry():
    lat, lon = 12.9716, 77.5946
    # Wind blowing towards North (0 deg)
    poly = compute_plume_polygon(
        lat=lat, lon=lon, wind_direction_deg=0.0, wind_speed_kmh=20.0, base_radius_m=200.0
    )

    assert len(poly) >= 6
    # First and last coordinates should match (closed polygon)
    assert poly[0] == poly[-1]

    # Downwind apex should be north of origin (lat > origin lat)
    assert any(pt[0] > lat for pt in poly)


def test_predict_secondary_hazards_fire():
    hazards_crit = predict_secondary_hazards(IncidentType.FIRE, Severity.CRITICAL, wind_speed_kmh=15.0)
    hazards_low = predict_secondary_hazards(IncidentType.FIRE, Severity.LOW, wind_speed_kmh=15.0)

    assert len(hazards_crit) >= 2
    types_crit = [h["hazard_type"] for h in hazards_crit]
    assert any("Flashover" in t for t in types_crit)

    flashover_crit = next(h for h in hazards_crit if "Flashover" in h["hazard_type"])
    flashover_low = next(h for h in hazards_low if "Flashover" in h["hazard_type"])
    assert flashover_crit["probability"] > flashover_low["probability"]


def test_predict_secondary_hazards_industrial():
    hazards = predict_secondary_hazards(
        IncidentType.INDUSTRIAL_ACCIDENT, Severity.CRITICAL, wind_speed_kmh=25.0
    )
    types = [h["hazard_type"] for h in hazards]
    assert any("Chemical Vapor Cloud" in t for t in types)
    assert any("BLEVE" in t for t in types)


def test_forecast_cascade_risk_score_scaling():
    crit_risk = forecast_cascade_risk(
        incident_type=IncidentType.INDUSTRIAL_ACCIDENT,
        severity=Severity.CRITICAL,
        priority=1,
        inc_lat=12.9716,
        inc_lon=77.5946,
        wind_speed_kmh=30.0,
    )
    low_risk = forecast_cascade_risk(
        incident_type=IncidentType.OTHER,
        severity=Severity.LOW,
        priority=4,
        inc_lat=12.9716,
        inc_lon=77.5946,
        wind_speed_kmh=5.0,
    )

    assert crit_risk["cascade_risk_score"] > low_risk["cascade_risk_score"]
    assert crit_risk["escalation_level"] in ("high", "critical")
    assert "evacuation_corridor" in crit_risk
    assert len(crit_risk["evacuation_corridor"]["polygon_coordinates"]) >= 6


def _create_incident(client, **overrides):
    payload = {
        "title": "Explosion in warehouse",
        "source": "citizen_report",
        "incident_type": "fire",
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    payload.update(overrides)
    return client.post("/incidents", json=payload).json()


def test_cascade_risk_api_endpoint(client: TestClient):
    incident = _create_incident(client)
    inc_id = incident["id"]
    resp = client.get(f"/incidents/{inc_id}/cascade-risk?wind_speed_kmh=22.5&wind_direction_deg=60.0")

    assert resp.status_code == 200
    data = resp.json()

    assert data["incident_id"] == str(inc_id)
    assert 0.0 <= data["cascade_risk_score"] <= 100.0
    assert len(data["secondary_hazards"]) > 0
    assert len(data["evacuation_corridor"]["polygon_coordinates"]) > 0
    assert data["weather"]["wind_speed_kmh"] == 22.5
    assert data["weather"]["wind_direction_deg"] == 60.0


def test_cascade_risk_api_404(client: TestClient):
    fake_id = uuid.uuid4()
    resp = client.get(f"/incidents/{fake_id}/cascade-risk")
    assert resp.status_code == 404
