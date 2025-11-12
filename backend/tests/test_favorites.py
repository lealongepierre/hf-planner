from app.models import Concert, User
from fastapi.testclient import TestClient
from sqlmodel import Session


def test_add_favorite_success(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    concert_id = test_concerts[0].id
    response = client.post(
        "/api/v1/favorites",
        json={"concert_id": concert_id},
        headers=auth_headers,
    )
    assert response.status_code == 201
    data = response.json()
    assert data["concert_id"] == concert_id
    assert "id" in data
    assert "user_id" in data


def test_add_favorite_without_auth(client: TestClient, test_concerts: list[Concert]):
    concert_id = test_concerts[0].id
    response = client.post(
        "/api/v1/favorites",
        json={"concert_id": concert_id},
    )
    assert response.status_code == 403


def test_add_favorite_nonexistent_concert(client: TestClient, auth_headers: dict):
    response = client.post(
        "/api/v1/favorites",
        json={"concert_id": 999},
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_add_duplicate_favorite(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    concert_id = test_concerts[0].id
    client.post(
        "/api/v1/favorites",
        json={"concert_id": concert_id},
        headers=auth_headers,
    )
    response = client.post(
        "/api/v1/favorites",
        json={"concert_id": concert_id},
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "already in favorites" in response.json()["detail"].lower()


def test_get_user_favorites(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[0].id},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[1].id},
        headers=auth_headers,
    )

    response = client.get("/api/v1/favorites", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    band_names = [concert["band_name"] for concert in data]
    assert "Metallica" in band_names
    assert "Iron Maiden" in band_names


def test_get_favorites_without_auth(client: TestClient):
    response = client.get("/api/v1/favorites")
    assert response.status_code == 403


def test_get_favorites_empty(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/favorites", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_remove_favorite_success(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    concert_id = test_concerts[0].id
    client.post(
        "/api/v1/favorites",
        json={"concert_id": concert_id},
        headers=auth_headers,
    )

    response = client.delete(
        f"/api/v1/favorites/{concert_id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    favorites_response = client.get("/api/v1/favorites", headers=auth_headers)
    assert len(favorites_response.json()) == 0


def test_remove_favorite_without_auth(client: TestClient, test_concerts: list[Concert]):
    response = client.delete(f"/api/v1/favorites/{test_concerts[0].id}")
    assert response.status_code == 403


def test_remove_nonexistent_favorite(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    response = client.delete(
        f"/api/v1/favorites/{test_concerts[0].id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_user_isolation(
    client: TestClient,
    session: Session,
    test_user: User,
    test_concerts: list[Concert],
):
    user1_response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser", "password": "testpassword123"},
    )
    user1_token = user1_response.json()["access_token"]
    user1_headers = {"Authorization": f"Bearer {user1_token}"}

    from app.core.security import get_password_hash

    user2 = User(username="testuser2", hashed_password=get_password_hash("password123"))
    session.add(user2)
    session.commit()

    user2_response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser2", "password": "password123"},
    )
    user2_token = user2_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[0].id},
        headers=user1_headers,
    )

    user1_favorites = client.get("/api/v1/favorites", headers=user1_headers).json()
    user2_favorites = client.get("/api/v1/favorites", headers=user2_headers).json()

    assert len(user1_favorites) == 1
    assert len(user2_favorites) == 0
