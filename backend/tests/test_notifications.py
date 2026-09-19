from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User
from app.services import notification_service


def _seed_user(db_session, email, role):
    user = User(
        email=email,
        full_name="Seeded User",
        role=role,
        hashed_password=hash_password("supersecret123"),
    )
    db_session.add(user)
    db_session.commit()
    return user


def test_critical_incident_notifies_dispatchers(client, db_session, monkeypatch):
    sent = []
    monkeypatch.setattr(
        notification_service,
        "send_email",
        lambda to, subject, body: sent.append((to, subject, body)),
    )

    _seed_user(db_session, "dispatcher@example.com", UserRole.DISPATCHER)
    _seed_user(db_session, "field@example.com", UserRole.FIELD_TEAM)

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


def test_notification_subject_strips_crlf_from_title(client, db_session, monkeypatch):
    """Regression test: incident.title flows unmodified into the email
    subject; CR/LF must be stripped so it can't break header assignment."""
    sent = []
    monkeypatch.setattr(
        notification_service,
        "send_email",
        lambda to, subject, body: sent.append((to, subject, body)),
    )

    _seed_user(db_session, "dispatcher@example.com", UserRole.DISPATCHER)

    client.post(
        "/incidents",
        json={
            "title": "Explosion\r\nBcc: attacker@evil.com",
            "description": "Multiple injured",
            "source": "emergency_call",
            "incident_type": "industrial_accident",
        },
    )

    assert len(sent) == 1
    _, subject, _ = sent[0]
    assert "\r" not in subject
    assert "\n" not in subject


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
