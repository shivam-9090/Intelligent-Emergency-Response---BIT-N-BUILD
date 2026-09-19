def test_incident_creation_broadcasts_over_websocket(client):
    with client.websocket_connect("/ws/dashboard") as websocket:
        client.post(
            "/incidents",
            json={
                "title": "Warehouse fire",
                "source": "citizen_report",
                "incident_type": "fire",
            },
        )
        message = websocket.receive_json()

    assert message["event"] == "incident_created"
    assert message["data"]["title"] == "Warehouse fire"


def test_assignment_lifecycle_broadcasts_over_websocket(client, dispatcher_headers):
    incident = client.post(
        "/incidents",
        json={"title": "Road accident", "source": "citizen_report", "incident_type": "road_accident"},
    ).json()
    resource = client.post(
        "/resources", json={"name": "Ambulance 1", "resource_type": "vehicle"}, headers=dispatcher_headers
    ).json()

    with client.websocket_connect("/ws/dashboard") as websocket:
        client.post(
            "/assignments",
            json={"incident_id": incident["id"], "resource_id": resource["id"]},
            headers=dispatcher_headers,
        )
        message = websocket.receive_json()

    assert message["event"] == "assignment_created"
    assert message["data"]["incident_id"] == incident["id"]


def test_no_broadcast_without_active_connection(client):
    """Broadcasting with no connected clients should not raise."""
    response = client.post(
        "/incidents",
        json={"title": "Minor incident", "source": "citizen_report", "incident_type": "other"},
    )
    assert response.status_code == 201
