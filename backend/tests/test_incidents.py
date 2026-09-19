def _incident_payload(**overrides):
    payload = {
        "title": "Warehouse fire on 5th Ave",
        "description": "Large fire reported, smoke visible",
        "source": "citizen_report",
        "incident_type": "fire",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "address": "5th Ave Warehouse District",
    }
    payload.update(overrides)
    return payload


def test_create_incident(client):
    response = client.post("/incidents", json=_incident_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Warehouse fire on 5th Ave"
    assert body["severity"] == "high"
    assert body["status"] == "reported"


def test_list_incidents(client):
    client.post("/incidents", json=_incident_payload())
    client.post("/incidents", json=_incident_payload(title="Second fire report"))

    response = client.get("/incidents")
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_get_incident_not_found(client):
    response = client.get("/incidents/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_duplicate_detection(client):
    first = client.post("/incidents", json=_incident_payload())
    first_id = first.json()["id"]

    second = client.post(
        "/incidents",
        json=_incident_payload(title="Same fire, different caller", latitude=12.9717, longitude=77.5947),
    )
    assert second.json()["duplicate_of_id"] == first_id
    assert second.json()["duplicate_score"] is not None
    assert "semantic similarity" in second.json()["duplicate_reason"]


def test_nearby_distinct_reports_are_not_auto_merged(client):
    client.post("/incidents", json=_incident_payload(description="Kitchen fire contained inside apartment 12"))
    second = client.post(
        "/incidents",
        json=_incident_payload(
            title="Separate warehouse fire",
            description="Warehouse flames spreading across industrial storage bays",
            latitude=12.9717,
            longitude=77.5947,
        ),
    )
    assert second.json()["duplicate_of_id"] is None
