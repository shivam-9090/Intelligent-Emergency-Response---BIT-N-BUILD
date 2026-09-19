def test_critical_incident_auto_generates_alert(client):
    response = client.post(
        "/incidents",
        json={
            "title": "Chemical plant explosion",
            "description": "Explosion reported, multiple injured",
            "source": "emergency_call",
            "incident_type": "industrial_accident",
        },
    )
    incident = response.json()
    assert incident["severity"] == "critical"

    alerts = client.get("/alerts").json()
    assert len(alerts) == 1
    assert alerts[0]["alert_type"] == "critical_incident"
    assert alerts[0]["incident_id"] == incident["id"]
    assert alerts[0]["resolved"] is False


def test_non_critical_incident_does_not_generate_alert(client):
    client.post(
        "/incidents",
        json={
            "title": "Minor fender bender",
            "source": "citizen_report",
            "incident_type": "other",
        },
    )
    assert client.get("/alerts").json() == []


def test_resolve_alert(client, dispatcher_headers):
    client.post(
        "/incidents",
        json={
            "title": "Building collapse",
            "description": "Structure collapse, people trapped",
            "source": "field_team",
            "incident_type": "industrial_accident",
        },
    )

    alert = client.get("/alerts").json()[0]
    response = client.post(f"/alerts/{alert['id']}/resolve", headers=dispatcher_headers)
    assert response.status_code == 200
    assert response.json()["resolved"] is True

    unresolved = client.get("/alerts", params={"resolved": False}).json()
    assert unresolved == []


def test_resolve_alert_requires_auth(client):
    client.post(
        "/incidents",
        json={
            "title": "Building collapse",
            "description": "Structure collapse, people trapped",
            "source": "field_team",
            "incident_type": "industrial_accident",
        },
    )
    alert = client.get("/alerts").json()[0]
    response = client.post(f"/alerts/{alert['id']}/resolve")
    assert response.status_code == 401
