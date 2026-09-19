def _create_incident(client, **overrides):
    payload = {
        "title": "Road accident on Main St",
        "source": "citizen_report",
        "incident_type": "road_accident",
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    payload.update(overrides)
    return client.post("/incidents", json=payload).json()


def _create_resource(client, **overrides):
    payload = {"name": "Ambulance 1", "resource_type": "vehicle"}
    payload.update(overrides)
    return client.post("/resources", json=payload).json()


def test_create_assignment_marks_resource_and_incident(client):
    incident = _create_incident(client)
    resource = _create_resource(client)

    response = client.post(
        "/assignments", json={"incident_id": incident["id"], "resource_id": resource["id"]}
    )
    assert response.status_code == 201
    assert response.json()["status"] == "assigned"

    incident_after = client.get(f"/incidents/{incident['id']}").json()
    assert incident_after["status"] == "assigned"

    resources_after = client.get("/resources").json()
    assert resources_after[0]["status"] == "assigned"


def test_cannot_assign_unavailable_resource(client):
    incident = _create_incident(client)
    resource = _create_resource(client)

    client.post("/assignments", json={"incident_id": incident["id"], "resource_id": resource["id"]})

    second_incident = _create_incident(client, title="Another accident")
    response = client.post(
        "/assignments", json={"incident_id": second_incident["id"], "resource_id": resource["id"]}
    )
    assert response.status_code == 409


def test_completing_assignment_frees_resource_and_resolves_incident(client):
    incident = _create_incident(client)
    resource = _create_resource(client)

    assignment = client.post(
        "/assignments", json={"incident_id": incident["id"], "resource_id": resource["id"]}
    ).json()

    response = client.patch(f"/assignments/{assignment['id']}/status", json={"status": "completed"})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

    resource_after = client.get("/resources").json()[0]
    assert resource_after["status"] == "available"

    incident_after = client.get(f"/incidents/{incident['id']}").json()
    assert incident_after["status"] == "resolved"
