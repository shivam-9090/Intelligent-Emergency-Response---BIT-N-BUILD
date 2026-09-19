def test_classify_text_endpoint_fire(client):
    desc = "Massive fire broke out in multi-story residential building, residents trapped!"
    response = client.post(
        "/incidents/classify-text",
        json={"description": desc},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["incident_type"] == "fire"
    assert data["severity"] == "critical"
    assert data["priority"] == 1
    assert data["confidence"] > 0.0


def test_classify_text_endpoint_medical(client):
    response = client.post(
        "/incidents/classify-text",
        json={"description": "55yo male collapsed at metro station, CPR underway, cardiac arrest."},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["incident_type"] == "medical"
    assert data["severity"] in ("high", "critical")
    assert data["priority"] in (1, 2)


def test_recommended_bundle_endpoint(client):
    # First create a critical incident
    inc_res = client.post(
        "/incidents",
        json={
            "title": "Major chemical explosion",
            "description": "Massive explosion at chemical factory, multiple casualties",
            "source": "sensor",
            "incident_type": "industrial_accident",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
    )
    assert inc_res.status_code == 201
    inc_id = inc_res.json()["id"]

    # Request recommended bundle
    bundle_res = client.get(f"/incidents/{inc_id}/bundle")
    assert bundle_res.status_code == 200
    bundle_data = bundle_res.json()
    assert bundle_data["incident_id"] == inc_id
    assert "bundle" in bundle_data


def test_recommended_bundle_not_found(client):
    response = client.get("/incidents/00000000-0000-0000-0000-000000000000/bundle")
    assert response.status_code == 404
