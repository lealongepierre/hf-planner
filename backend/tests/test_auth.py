from app.models import User
from fastapi.testclient import TestClient


def test_signup_success(client: TestClient):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "newuser", "password": "password123"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "newuser"
    assert "id" in data
    assert "password" not in data


def test_signup_duplicate_username(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "testuser", "password": "password123"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


def test_signup_short_username(client: TestClient):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "ab", "password": "password123"},
    )
    assert response.status_code == 422


def test_signup_short_password(client: TestClient):
    response = client.post(
        "/api/v1/auth/signup",
        json={"username": "newuser", "password": "12345"},
    )
    assert response.status_code == 422


def test_signin_success(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser", "password": "testpassword123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


def test_signin_wrong_password(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


def test_signin_nonexistent_user(client: TestClient):
    response = client.post(
        "/api/v1/auth/signin",
        json={"username": "nonexistent", "password": "password123"},
    )
    assert response.status_code == 401


def test_signin_token_is_valid_jwt(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser", "password": "testpassword123"},
    )
    token = response.json()["access_token"]
    assert token.count(".") == 2
