from app.core.security import get_password_hash
from app.models import Concert, User
from fastapi.testclient import TestClient
from sqlmodel import Session


def test_list_users_requires_auth(client: TestClient):
    response = client.get("/api/v1/users")
    assert response.status_code == 403


def test_list_users_success(
    client: TestClient, test_user: User, session: Session, auth_headers: dict
):
    user2 = User(username="alice", hashed_password=get_password_hash("password123"))
    user3 = User(
        username="bob", hashed_password=get_password_hash("password123"), favorites_public=True
    )
    session.add(user2)
    session.add(user3)
    session.commit()

    response = client.get("/api/v1/users", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3

    usernames = {u["username"] for u in data}
    assert "testuser" in usernames
    assert "alice" in usernames
    assert "bob" in usernames

    bob = next(u for u in data if u["username"] == "bob")
    assert bob["favorites_public"] is True


def test_update_favorites_visibility_requires_auth(client: TestClient):
    response = client.patch("/api/v1/users/me/favorites-visibility", json={"public": True})
    assert response.status_code == 403


def test_update_favorites_visibility_to_public(
    client: TestClient, test_user: User, auth_headers: dict
):
    response = client.patch(
        "/api/v1/users/me/favorites-visibility",
        json={"public": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "testuser"
    assert data["favorites_public"] is True


def test_update_favorites_visibility_to_private(
    client: TestClient, test_user: User, session: Session, auth_headers: dict
):
    test_user.favorites_public = True
    session.add(test_user)
    session.commit()

    response = client.patch(
        "/api/v1/users/me/favorites-visibility",
        json={"public": False},
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["favorites_public"] is False


def test_get_user_favorites_requires_auth(client: TestClient):
    response = client.get("/api/v1/users/someuser/favorites")
    assert response.status_code == 403


def test_get_user_favorites_nonexistent_user(client: TestClient, auth_headers: dict):
    response = client.get("/api/v1/users/nonexistent/favorites", headers=auth_headers)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_get_user_favorites_private(client: TestClient, session: Session, auth_headers: dict):
    user2 = User(
        username="alice", hashed_password=get_password_hash("password123"), favorites_public=False
    )
    session.add(user2)
    session.commit()

    response = client.get("/api/v1/users/alice/favorites", headers=auth_headers)
    assert response.status_code == 403
    assert "private" in response.json()["detail"].lower()


def test_get_user_favorites_public_empty(client: TestClient, session: Session, auth_headers: dict):
    user2 = User(
        username="alice", hashed_password=get_password_hash("password123"), favorites_public=True
    )
    session.add(user2)
    session.commit()

    response = client.get("/api/v1/users/alice/favorites", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []


def test_get_user_favorites_public_with_concerts(
    client: TestClient,
    test_concerts: list[Concert],
    session: Session,
    auth_headers: dict,
):
    user2 = User(
        username="alice", hashed_password=get_password_hash("password123"), favorites_public=True
    )
    session.add(user2)
    session.commit()

    user2_response = client.post(
        "/api/v1/auth/signin",
        json={"username": "alice", "password": "password123"},
    )
    user2_token = user2_response.json()["access_token"]
    user2_headers = {"Authorization": f"Bearer {user2_token}"}

    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[0].id},
        headers=user2_headers,
    )
    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[1].id},
        headers=user2_headers,
    )

    response = client.get("/api/v1/users/alice/favorites", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    band_names = {concert["band_name"] for concert in data}
    assert "Metallica" in band_names
    assert "Iron Maiden" in band_names


def test_user_can_view_own_private_favorites(
    client: TestClient,
    test_user: User,
    test_concerts: list[Concert],
    session: Session,
    auth_headers: dict,
):
    test_user.favorites_public = False
    session.add(test_user)
    session.commit()

    client.post(
        "/api/v1/favorites",
        json={"concert_id": test_concerts[0].id},
        headers=auth_headers,
    )

    response = client.get("/api/v1/users/testuser/favorites", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["band_name"] == "Metallica"
