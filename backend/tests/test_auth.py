from app.core.security import hash_password
from app.models.enums import UserRole
from app.models.user import User


def _register(client, **overrides):
    payload = {
        "email": "user@example.com",
        "password": "supersecret123",
        "full_name": "Jamie User",
    }
    payload.update(overrides)
    return client.post("/auth/register", json=payload)


def _login(client, email="user@example.com", password="supersecret123"):
    return client.post("/auth/login", data={"username": email, "password": password})


def _seed_user(db_session, email, role, password="supersecret123"):
    user = User(
        email=email,
        full_name="Seeded User",
        role=role,
        hashed_password=hash_password(password),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def test_register_user(client):
    response = _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "user@example.com"
    assert body["role"] == "field_team"
    assert "password" not in body
    assert "hashed_password" not in body


def test_register_ignores_client_supplied_role(client):
    """Regression test: self-registration must never honor a client-supplied
    role. Confirms the privilege-escalation fix."""
    response = _register(client, role="admin")
    assert response.status_code == 201
    assert response.json()["role"] == "field_team"

    token = _login(client).json()["access_token"]
    resource_response = client.post(
        "/resources",
        json={"name": "Fire Engine", "resource_type": "vehicle"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resource_response.status_code == 403


def test_register_duplicate_email_rejected(client):
    _register(client)
    response = _register(client)
    assert response.status_code == 409


def test_login_success(client):
    _register(client)
    response = _login(client)
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]


def test_login_wrong_password(client):
    _register(client)
    response = _login(client, password="wrongpassword")
    assert response.status_code == 401


def test_me_requires_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_me_returns_current_user(client):
    _register(client)
    token = _login(client).json()["access_token"]
    response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


def test_resource_creation_requires_auth(client):
    response = client.post("/resources", json={"name": "Fire Engine", "resource_type": "vehicle"})
    assert response.status_code == 401


def test_field_team_cannot_create_resource(client):
    _register(client)
    token = _login(client).json()["access_token"]

    response = client.post(
        "/resources",
        json={"name": "Fire Engine", "resource_type": "vehicle"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_role_update_requires_admin(client, db_session):
    target = _seed_user(db_session, "target@example.com", UserRole.FIELD_TEAM)
    _register(client, email="notadmin@example.com")
    token = _login(client, email="notadmin@example.com").json()["access_token"]

    response = client.patch(
        f"/auth/users/{target.id}/role",
        json={"role": "dispatcher"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_admin_can_promote_user_to_dispatcher(client, db_session):
    admin = _seed_user(db_session, "admin@example.com", UserRole.ADMIN)
    target = _seed_user(db_session, "promote-me@example.com", UserRole.FIELD_TEAM)
    admin_token = _login(client, email=admin.email).json()["access_token"]

    response = client.patch(
        f"/auth/users/{target.id}/role",
        json={"role": "dispatcher"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "dispatcher"

    target_token = _login(client, email=target.email).json()["access_token"]
    resource_response = client.post(
        "/resources",
        json={"name": "Fire Engine", "resource_type": "vehicle"},
        headers={"Authorization": f"Bearer {target_token}"},
    )
    assert resource_response.status_code == 201
