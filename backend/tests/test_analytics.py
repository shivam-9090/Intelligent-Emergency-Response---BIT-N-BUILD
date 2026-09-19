def _create_incident(client, **overrides):
    payload = {
        "title": "Incident",
        "source": "citizen_report",
        "incident_type": "fire",
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    payload.update(overrides)
    return client.post("/incidents", json=payload).json()


def _create_resource(client, headers, **overrides):
    payload = {"name": "Unit", "resource_type": "vehicle"}
    payload.update(overrides)
    return client.post("/resources", json=payload, headers=headers).json()


def test_incident_breakdown_empty(client):
    response = client.get("/analytics/incidents")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 0
    assert body["by_type"] == []
    assert body["by_severity"] == []


def test_incident_breakdown_counts(client):
    _create_incident(client, incident_type="fire")
    _create_incident(client, incident_type="fire")
    _create_incident(client, incident_type="flood")

    body = client.get("/analytics/incidents").json()
    assert body["total"] == 3

    by_type = {row["incident_type"]: row["count"] for row in body["by_type"]}
    assert by_type["fire"] == 2
    assert by_type["flood"] == 1


def test_response_delays_empty(client):
    body = client.get("/analytics/response-delays").json()
    assert body["overall_average_minutes"] is None
    assert body["overall_sample_size"] == 0
    assert body["by_type"] == []


def test_response_delays_with_assignment(client, dispatcher_headers):
    incident = _create_incident(client)
    resource = _create_resource(client, dispatcher_headers)
    client.post(
        "/assignments",
        json={"incident_id": incident["id"], "resource_id": resource["id"]},
        headers=dispatcher_headers,
    )

    body = client.get("/analytics/response-delays").json()
    assert body["overall_sample_size"] == 1
    assert body["overall_average_minutes"] is not None
    assert body["overall_average_minutes"] >= 0
    assert len(body["by_type"]) == 1
    assert body["by_type"][0]["incident_type"] == "fire"


def test_resource_shortages(client, dispatcher_headers):
    resource = _create_resource(client, dispatcher_headers, resource_type="team")
    incident = _create_incident(client, incident_type="other")
    client.post(
        "/assignments",
        json={"incident_id": incident["id"], "resource_id": resource["id"]},
        headers=dispatcher_headers,
    )

    body = client.get("/analytics/resource-shortages").json()
    team_row = next(row for row in body if row["resource_type"] == "team")
    assert team_row["total"] == 1
    assert team_row["assigned"] == 1
    assert team_row["available"] == 0
    assert team_row["shortage"] is True


def test_hotspots(client):
    _create_incident(client, latitude=12.9716, longitude=77.5946)
    _create_incident(client, latitude=12.9716, longitude=77.5946)
    _create_incident(client, latitude=13.05, longitude=77.6)

    body = client.get("/analytics/hotspots").json()
    assert body[0]["count"] == 2
    assert body[0]["latitude"] == 12.97
    assert body[0]["longitude"] == 77.59
