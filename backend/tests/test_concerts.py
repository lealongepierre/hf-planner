from app.models import Concert
from fastapi.testclient import TestClient


def test_get_all_concerts(client: TestClient, test_concerts: list[Concert]):
    response = client.get("/api/v1/concerts")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
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
    assert len(data) == 2
    assert all(concert["day"] == "Friday" for concert in data)
    band_names = [concert["band_name"] for concert in data]
    assert "Metallica" in band_names
    assert "Iron Maiden" in band_names


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
