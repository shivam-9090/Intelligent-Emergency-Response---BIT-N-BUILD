import pytest
from starlette.websockets import WebSocketDisconnect


def _token(headers: dict) -> str:
    return headers["Authorization"].removeprefix("Bearer ")


def test_websocket_requires_token(client):
    with pytest.raises(WebSocketDisconnect), client.websocket_connect("/ws/dashboard"):
        pass


def test_websocket_rejects_invalid_token(client):
    with (
        pytest.raises(WebSocketDisconnect),
        client.websocket_connect("/ws/dashboard?token=not-a-real-token"),
    ):
        pass


def test_incident_creation_broadcasts_over_websocket(client, dispatcher_headers):
    token = _token(dispatcher_headers)
    with client.websocket_connect(f"/ws/dashboard?token={token}") as websocket:
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
    token = _token(dispatcher_headers)
    incident = client.post(
        "/incidents",
        json={"title": "Road accident", "source": "citizen_report", "incident_type": "road_accident"},
    ).json()
    resource = client.post(
        "/resources", json={"name": "Ambulance 1", "resource_type": "vehicle"}, headers=dispatcher_headers
    ).json()

    with client.websocket_connect(f"/ws/dashboard?token={token}") as websocket:
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
