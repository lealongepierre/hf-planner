import pytest
from fastapi.testclient import TestClient

from app.models import Concert


def test_get_all_concerts(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 6
    assert all("band_name" in concert for concert in data)
    assert all("stage" in concert for concert in data)


def test_get_concerts_empty_database(client: TestClient):
    response = client.get("/api/v1/concerts")
    assert response.status_code == 200
    assert response.json() == []


def test_get_concerts_filter_by_day(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts?day=Friday")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    band_names = [concert["band_name"] for concert in data]
    assert "Metallica" in band_names
    assert "Iron Maiden" in band_names
    assert "Electric Wizard" in band_names


def test_get_concerts_filter_by_stage(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts?stage=Mainstage 1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert all(concert["stage"] == "Mainstage 1" for concert in data)


def test_get_concerts_filter_by_day_and_stage(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts?day=Friday&stage=Mainstage 1")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["band_name"] == "Metallica"
    assert data[0]["day"] == "Friday"
    assert data[0]["stage"] == "Mainstage 1"


def test_get_concerts_no_match(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts?day=Sunday")
    assert response.status_code == 200
    assert response.json() == []


def test_get_concert_by_id(client: TestClient, test_concerts: list[Concert]):
    concert_id = test_concerts[0].id
    response = client.get(f"/api/v1/concerts/{concert_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == concert_id
    assert data["band_name"] == "Metallica"
    assert data["day"] == "Friday"
    assert data["stage"] == "Mainstage 1"


def test_get_concert_nonexistent_id(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts/999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_concert_response_structure(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts")
    data = response.json()[0]
    required_fields = ["id", "band_name", "day", "start_time", "end_time", "stage"]
    assert all(field in data for field in required_fields)


def test_after_midnight_concerts_appear_in_previous_day(
    client: TestClient, test_concerts: list[Concert]
):
    response = client.get("/api/v1/concerts?day=Friday")
    assert response.status_code == 200
    data = response.json()

    band_names = [concert["band_name"] for concert in data]
    assert "Electric Wizard" in band_names

    electric_wizard = next(c for c in data if c["band_name"] == "Electric Wizard")
    assert electric_wizard["day"] == "Saturday"
    assert electric_wizard["festival_day"] == "Friday"
    assert electric_wizard["start_time"] == "01:30:00"


def test_after_midnight_concerts_saturday(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts?day=Saturday")
    assert response.status_code == 200
    data = response.json()

    band_names = [concert["band_name"] for concert in data]
    assert "Slayer" in band_names
    assert "Gojira" in band_names
    assert "Sleep" in band_names

    sleep = next(c for c in data if c["band_name"] == "Sleep")
    assert sleep["day"] == "Sunday"
    assert sleep["festival_day"] == "Saturday"
    assert sleep["start_time"] == "02:00:00"


def test_after_midnight_concerts_do_not_appear_in_calendar_day(
    client: TestClient, test_concerts: list[Concert]
):
    response = client.get("/api/v1/concerts?day=Sunday")
    assert response.status_code == 200
    data = response.json()

    band_names = [concert["band_name"] for concert in data]
    assert "Sleep" not in band_names


# --- Rating endpoint ---


@pytest.mark.parametrize(
    "rating,test_id",
    [
        (15, "valid_mid_rating"),
        (0, "valid_zero"),
        (20, "valid_max"),
        (None, "clear_rating"),
    ],
)
def test_update_rating_as_wesker(
    client: TestClient,
    wesker_auth_headers: dict,
    test_concerts: list[Concert],
    rating: int | None,
    test_id: str,
):
    """Wesker can set any rating between 0 and 20, or clear it with null.
    - Valid mid-range rating is saved and returned
    - Zero and max boundary values are accepted
    - Null clears an existing rating
    """
    concert_id = test_concerts[0].id
    response = client.patch(
        f"/api/v1/concerts/{concert_id}/rating",
        json={"rating": rating},
        headers=wesker_auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["rating"] == rating


def test_update_rating_non_wesker_returns_403(
    client: TestClient,
    auth_headers: dict,
    test_concerts: list[Concert],
):
    """Non-Wesker authenticated user cannot set a rating."""
    concert_id = test_concerts[0].id
    response = client.patch(
        f"/api/v1/concerts/{concert_id}/rating",
        json={"rating": 10},
        headers=auth_headers,
    )
    assert response.status_code == 403
    assert "not authorized" in response.json()["detail"].lower()


def test_update_rating_unauthenticated_returns_403(
    client: TestClient,
    test_concerts: list[Concert],
):
    """Unauthenticated request to set a rating returns 403.

    HTTPBearer raises 403 when the Authorization header is absent.
    """
    concert_id = test_concerts[0].id
    response = client.patch(
        f"/api/v1/concerts/{concert_id}/rating",
        json={"rating": 10},
    )
    assert response.status_code == 403


@pytest.mark.parametrize(
    "rating,test_id",
    [
        (21, "above_max"),
        (-1, "below_min"),
    ],
)
def test_update_rating_out_of_range_returns_422(
    client: TestClient,
    wesker_auth_headers: dict,
    test_concerts: list[Concert],
    rating: int,
    test_id: str,
):
    """Rating values outside 0-20 are rejected with 422.
    - 21 is above maximum
    - -1 is below minimum
    """
    concert_id = test_concerts[0].id
    response = client.patch(
        f"/api/v1/concerts/{concert_id}/rating",
        json={"rating": rating},
        headers=wesker_auth_headers,
    )
    assert response.status_code == 422


def test_update_rating_nonexistent_concert_returns_404(
    client: TestClient,
    wesker_auth_headers: dict,
):
    """Rating a concert that does not exist returns 404."""
    response = client.patch(
        "/api/v1/concerts/999/rating",
        json={"rating": 10},
        headers=wesker_auth_headers,
    )
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_concert_response_includes_rating_field(client: TestClient, test_concerts: list[Concert]):
    """GET /concerts response includes a rating field (null by default)."""
    response = client.get("/api/v1/concerts")
    data = response.json()[0]
    assert "rating" in data
    assert data["rating"] is None
