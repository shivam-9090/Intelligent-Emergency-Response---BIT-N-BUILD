from app.services import notification_service


def _register(client, email="dispatcher@example.com", role="dispatcher"):
    client.post(
        "/auth/register",
        json={
            "email": email,
            "password": "supersecret123",
            "full_name": "Dana Dispatcher",
            "role": role,
        },
    )


def test_critical_incident_notifies_dispatchers(client, monkeypatch):
    sent = []
    monkeypatch.setattr(
        notification_service,
        "send_email",
        lambda to, subject, body: sent.append((to, subject, body)),
    )

    _register(client, email="dispatcher@example.com", role="dispatcher")
    _register(client, email="field@example.com", role="field_team")

    client.post(
        "/incidents",
        json={
            "title": "Factory explosion",
            "description": "Explosion, multiple injured",
            "source": "emergency_call",
            "incident_type": "industrial_accident",
        },
    )

    assert len(sent) == 1
    recipients, subject, body = sent[0]
    assert recipients == ["dispatcher@example.com"]
    assert "Factory explosion" in subject
    assert "Factory explosion" in body


def test_no_notification_without_dispatchers(client, monkeypatch):
    sent = []
    monkeypatch.setattr(
        notification_service,
        "send_email",
        lambda to, subject, body: sent.append((to, subject, body)),
    )

    client.post(
        "/incidents",
        json={
            "title": "Factory explosion",
            "description": "Explosion, multiple injured",
            "source": "emergency_call",
            "incident_type": "industrial_accident",
        },
    )

    assert sent == []
