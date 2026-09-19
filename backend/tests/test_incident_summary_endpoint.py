from app.services import summary_service


def _create_incident(client, **overrides):
    payload = {
        "title": "Flooded road",
        "source": "sensor",
        "incident_type": "flood",
    }
    payload.update(overrides)
    return client.post("/incidents", json=payload).json()


def test_summary_endpoint_returns_fallback_without_llm(client, monkeypatch):
    monkeypatch.setattr(summary_service, "generate_incident_summary", lambda prompt: None)
    incident = _create_incident(client)

    response = client.get(f"/incidents/{incident['id']}/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["incident_id"] == incident["id"]
    assert body["ai_generated"] is False
    assert "Flooded road" in body["summary"]


def test_summary_endpoint_returns_ai_output(client, monkeypatch):
    monkeypatch.setattr(
        summary_service, "generate_incident_summary", lambda prompt: "Model-generated summary."
    )
    incident = _create_incident(client)

    response = client.get(f"/incidents/{incident['id']}/summary")
    assert response.status_code == 200
    body = response.json()
    assert body["ai_generated"] is True
    assert body["summary"] == "Model-generated summary."


def test_summary_endpoint_404_for_unknown_incident(client):
    response = client.get("/incidents/00000000-0000-0000-0000-000000000000/summary")
    assert response.status_code == 404
