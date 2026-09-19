def test_create_and_list_resources(client, dispatcher_headers):
    payload = {
        "name": "Fire Engine 12",
        "resource_type": "vehicle",
        "capability": "fire suppression",
        "latitude": 12.9716,
        "longitude": 77.5946,
    }
    create_response = client.post("/resources", json=payload, headers=dispatcher_headers)
    assert create_response.status_code == 201
    assert create_response.json()["status"] == "available"

    list_response = client.get("/resources")
    assert list_response.status_code == 200
    assert len(list_response.json()) == 1


def test_recommended_resources_for_incident(client, dispatcher_headers):
    client.post(
        "/resources",
        json={
            "name": "Fire Engine 12",
            "resource_type": "vehicle",
            "latitude": 12.9716,
            "longitude": 77.5946,
        },
        headers=dispatcher_headers,
    )

    incident_response = client.post(
        "/incidents",
        json={
            "title": "Fire near market",
            "source": "citizen_report",
            "incident_type": "fire",
            "latitude": 12.9720,
            "longitude": 77.5950,
        },
    )
    incident_id = incident_response.json()["id"]

    response = client.get(f"/incidents/{incident_id}/recommended-resources")
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "Fire Engine 12"
