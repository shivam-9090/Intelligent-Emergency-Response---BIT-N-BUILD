from app.ml.demand_forecaster import (
    CIVIC_SECTORS,
    DemandForecastingEngine,
    get_temporal_diurnal_factor,
    haversine_km,
)
from app.models.enums import IncidentSource, IncidentStatus, IncidentType, Severity
from app.models.incident import Incident


def test_haversine_km_calculation():
    # Distance between Vidhana Soudha (12.9791, 77.5913) and Victoria Hospital (12.9634, 77.5746) is ~2.5 km
    dist = haversine_km(12.9791, 77.5913, 12.9634, 77.5746)
    assert 2.0 <= dist <= 3.2


def test_diurnal_temporal_factor():
    # Peak traffic hours (09:00) should elevate road accident multiplier
    factor_peak = get_temporal_diurnal_factor(9, IncidentType.ROAD_ACCIDENT.value)
    assert factor_peak > 1.0

    # Night hours (02:00) should reduce traffic demand
    factor_night = get_temporal_diurnal_factor(2, IncidentType.ROAD_ACCIDENT.value)
    assert factor_night < 1.0


def test_demand_engine_empty_incidents_fallback():
    engine = DemandForecastingEngine(grid_step_deg=0.04)  # Coarser grid for rapid test
    res = engine.compute_forecast(incidents=[], forecast_horizon_hours=2)

    assert res.forecast_horizon_hours == 2
    assert len(res.heatmap_grid) > 0
    # Every point has intensity in [0, 1]
    for pt in res.heatmap_grid:
        assert 0.0 <= pt.intensity <= 1.0
    # Fallback seeding produces staging recommendations
    assert len(res.staging_recommendations) > 0
    assert res.total_projected_eta_savings_minutes > 0.0


def test_demand_engine_clustered_incidents():
    engine = DemandForecastingEngine(grid_step_deg=0.03)
    # Cluster 3 critical fire incidents around Peenya Industrial area
    incidents = [
        {"latitude": 13.0280, "longitude": 77.5190, "severity": "critical", "incident_type": "fire"},
        {"latitude": 13.0290, "longitude": 77.5200, "severity": "critical", "incident_type": "fire"},
        {"latitude": 13.0275, "longitude": 77.5185, "severity": "high", "incident_type": "fire"},
    ]
    res = engine.compute_forecast(incidents=incidents, forecast_horizon_hours=1)

    assert res.active_incidents_considered == 3
    assert res.city_wide_risk_index > 0.0
    assert len(res.staging_recommendations) >= 1

    # Check top staging point is near Peenya cluster
    top_stage = res.staging_recommendations[0]
    dist_to_peenya = haversine_km(
        top_stage.latitude, top_stage.longitude, CIVIC_SECTORS[0]["latitude"], CIVIC_SECTORS[0]["longitude"]
    )
    assert dist_to_peenya < 5.0
    assert top_stage.recommended_unit_type in {"fire_engine", "rescue_team"}
    assert top_stage.projected_eta_savings_minutes >= 7.0


def test_predictive_demand_api_endpoint(client, db_session):
    # Insert test incidents
    inc = Incident(
        title="Industrial Boiler Hazard",
        source=IncidentSource.EMERGENCY_CALL,
        incident_type=IncidentType.INDUSTRIAL_ACCIDENT,
        severity=Severity.HIGH,
        priority=1,
        status=IncidentStatus.REPORTED,
        latitude=12.9800,
        longitude=77.5800,
    )
    db_session.add(inc)
    db_session.commit()

    resp = client.get("/analytics/predictive-demand-forecast?horizon_hours=3")
    assert resp.status_code == 200
    data = resp.json()

    assert data["forecast_horizon_hours"] == 3
    assert "heatmap_grid" in data
    assert len(data["heatmap_grid"]) > 0
    assert "staging_recommendations" in data
    assert "city_wide_risk_index" in data
    assert "algorithm" in data
