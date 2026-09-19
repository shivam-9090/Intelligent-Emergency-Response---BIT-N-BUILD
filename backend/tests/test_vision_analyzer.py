import base64

import pytest
from starlette.testclient import TestClient

from app.ml.vision_analyzer import analyze_incident_image, decode_image_base64
from app.models.enums import IncidentType, Severity

# 1x1 transparent PNG sample byte stream
SAMPLE_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)
SAMPLE_B64_RAW = base64.b64encode(SAMPLE_PNG_BYTES).decode("utf-8")
SAMPLE_B64_DATA_URI = f"data:image/png;base64,{SAMPLE_B64_RAW}"


def test_decode_image_base64():
    data, mime = decode_image_base64(SAMPLE_B64_DATA_URI)
    assert data == SAMPLE_PNG_BYTES
    assert mime == "image/png"

    # Also test plain base64 without header
    data2, mime2 = decode_image_base64(SAMPLE_B64_RAW)
    assert data2 == SAMPLE_PNG_BYTES
    assert mime2 == "image/png"


def test_decode_image_base64_invalid():
    with pytest.raises(ValueError, match="Invalid base64"):
        decode_image_base64("this-is-not-valid-base64!@#$")

    with pytest.raises(ValueError, match="too small"):
        decode_image_base64(base64.b64encode(b"short").decode("utf-8"))


def test_analyze_image_fire_context():
    res = analyze_incident_image(
        image_base64=SAMPLE_B64_DATA_URI,
        incident_type=IncidentType.FIRE,
        context_description="Massive chemical warehouse explosion with black smoke.",
    )
    assert res.damage_severity == Severity.CRITICAL
    assert res.damage_score >= 80.0
    assert res.authenticity_status == "verified_authentic"
    assert len(res.detected_hazards) >= 2
    assert any("smoke" in h.hazard_type for h in res.detected_hazards)
    assert res.trapped_victims_likely is True
    assert len(res.recommended_tactical_gear) > 0


def test_analyze_image_flood_context():
    res = analyze_incident_image(
        image_base64=SAMPLE_B64_DATA_URI,
        incident_type=IncidentType.FLOOD,
        context_description="Vehicles submerged in 1.5m flood water on Ring Road.",
    )
    assert res.damage_severity == Severity.HIGH
    assert res.damage_score >= 60.0
    assert any("water" in h.hazard_type for h in res.detected_hazards)
    assert "Inflatable Rescue Sponson Boat" in res.recommended_tactical_gear


def test_analyze_image_endpoint(client: TestClient):
    payload = {
        "image_base64": SAMPLE_B64_DATA_URI,
        "incident_type_hint": "fire",
        "context_description": "Structural roof collapse and flames burning through facade.",
    }
    response = client.post("/incidents/analyze-image", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "analysis_id" in data
    assert data["damage_severity"] == "critical"
    assert data["authenticity_status"] == "verified_authentic"
    assert len(data["detected_hazards"]) > 0


def test_analyze_incident_attachment_endpoint(client: TestClient):
    # Create incident first
    create_res = client.post(
        "/incidents",
        json={
            "title": "Industrial Boiler Rupture",
            "description": "Explosion in machine shop with chemical fumes",
            "source": "citizen_report",
            "incident_type": "industrial_accident",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
    )
    assert create_res.status_code == 201
    inc_id = create_res.json()["id"]

    # Attach and analyze image
    payload = {
        "image_base64": SAMPLE_B64_DATA_URI,
    }
    response = client.post(f"/incidents/{inc_id}/analyze-image", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["damage_severity"] in ["critical", "high"]
    assert "analysis_provider" in data
