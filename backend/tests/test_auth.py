def _register(client, **overrides):
    payload = {
        "email": "dispatcher@example.com",
        "password": "supersecret123",
        "full_name": "Dana Dispatcher",
        "role": "dispatcher",
    }
    payload.update(overrides)
    return client.post("/auth/register", json=payload)


def _login(client, email="dispatcher@example.com", password="supersecret123"):
    return client.post("/auth/login", data={"username": email, "password": password})


def test_register_user(client):
    response = _register(client)
    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "dispatcher@example.com"
    assert "password" not in body
    assert "hashed_password" not in body


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
    assert response.json()["email"] == "dispatcher@example.com"


def test_resource_creation_requires_auth(client):
    response = client.post("/resources", json={"name": "Fire Engine", "resource_type": "vehicle"})
    assert response.status_code == 401


def test_field_team_cannot_create_resource(client):
    _register(client, email="field@example.com", role="field_team")
    token = _login(client, email="field@example.com").json()["access_token"]

    response = client.post(
        "/resources",
        json={"name": "Fire Engine", "resource_type": "vehicle"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_dispatcher_can_create_resource(client):
    _register(client)
    token = _login(client).json()["access_token"]

    response = client.post(
        "/resources",
        json={"name": "Fire Engine", "resource_type": "vehicle"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
