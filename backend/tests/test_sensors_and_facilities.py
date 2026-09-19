from app.ml.sensor_telemetry import analyze_sensor_telemetry
from app.models.enums import IncidentType, Severity


def test_sensor_telemetry_normal():
    payload = {
        "sensor_id": "SENSOR-WATER-01",
        "sensor_type": "water_level",
        "district": "Ulsoor Lake",
        "readings": {"water_level_cm": 45.0},
        "thresholds": {"warning_water_level_cm": 120.0, "critical_water_level_cm": 200.0},
    }
    result = analyze_sensor_telemetry(payload)
    assert not result["is_anomaly"]
    assert result["severity"] == Severity.LOW


def test_sensor_telemetry_critical_flood():
    payload = {
        "sensor_id": "SENSOR-WATER-02",
        "sensor_type": "water_level",
        "district": "Ulsoor Lake",
        "readings": {"water_level_cm": 235.0},
        "thresholds": {"warning_water_level_cm": 120.0, "critical_water_level_cm": 200.0},
    }
    result = analyze_sensor_telemetry(payload)
    assert result["is_anomaly"]
    assert result["severity"] == Severity.CRITICAL
    assert result["priority"] == 1
    assert result["incident_type"] == IncidentType.FLOOD


def test_sensor_telemetry_endpoint_auto_incident(client):
    response = client.post(
        "/sensors/telemetry",
        json={
            "sensor_id": "SENSOR-GAS-IND-99",
            "sensor_type": "toxic_gas",
            "district": "Peenya Industrial Zone",
            "latitude": 13.0285,
            "longitude": 77.5195,
            "readings": {"gas_type": "chlorine", "concentration_ppm": 95.0},
            "thresholds": {"warning_ppm": 25.0, "critical_ppm": 50.0},
            "auto_create_incident": True,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["incident_created"] is True
    assert data["incident"] is not None
    assert data["incident"]["source"] == "sensor"
    assert data["incident"]["incident_type"] == "industrial_accident"
    assert data["incident"]["severity"] == "critical"


def test_hospital_recommendations_endpoint(client):
    # Create a severe fire incident
    inc_res = client.post(
        "/incidents",
        json={
            "title": "Severe commercial fire",
            "description": "Commercial complex ablaze, multiple burn injuries",
            "source": "sensor",
            "incident_type": "fire",
            "latitude": 12.9634,
            "longitude": 77.5755,
        },
    )
    assert inc_res.status_code == 201
    inc_id = inc_res.json()["id"]

    hosp_res = client.get(f"/incidents/{inc_id}/hospitals?limit=3")
    assert hosp_res.status_code == 200
    data = hosp_res.json()
    assert data["incident_id"] == inc_id
    assert "facilities" in data
    assert len(data["facilities"]) > 0

    first_hosp = data["facilities"][0]
    assert "name" in first_hosp
    assert "available_icu_beds" in first_hosp
    assert first_hosp["available_icu_beds"] > 0
    assert "eta_minutes" in first_hosp

