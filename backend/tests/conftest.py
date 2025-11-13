from datetime import time

import pytest
from app.core.security import get_password_hash
from app.database.connection import get_session
from app.main import app
from app.models import Concert, User
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool


@pytest.fixture(name="engine")
def engine_fixture():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session")
def session_fixture(engine):
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, expire_on_commit=False)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        yield session

    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    user = User(
        username="testuser",
        hashed_password=get_password_hash("testpassword123"),
    )
    session.add(user)
    session.commit()
    session.flush()
    session.refresh(user)
    session.expunge(user)
    session.add(user)
    return user


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client: TestClient, test_user: User):
    response = client.post(
        "/api/v1/auth/signin",
        json={"username": "testuser", "password": "testpassword123"},
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(name="test_concerts")
def test_concerts_fixture(session: Session):
    concerts = [
        Concert(
            band_name="Metallica",
            day="Friday",
            festival_day="Friday",
            start_time=time(21, 0),
            end_time=time(23, 0),
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Iron Maiden",
            day="Friday",
            festival_day="Friday",
            start_time=time(19, 0),
            end_time=time(20, 30),
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Slayer",
            day="Saturday",
            festival_day="Saturday",
            start_time=time(21, 0),
            end_time=time(23, 0),
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Gojira",
            day="Saturday",
            festival_day="Saturday",
            start_time=time(19, 0),
            end_time=time(20, 30),
            stage="The Altar",
        ),
        Concert(
            band_name="Electric Wizard",
            day="Saturday",
            festival_day="Friday",
            start_time=time(1, 30),
            end_time=time(3, 0),
            stage="The Temple",
        ),
        Concert(
            band_name="Sleep",
            day="Sunday",
            festival_day="Saturday",
            start_time=time(2, 0),
            end_time=time(3, 30),
            stage="The Altar",
        ),
    ]
    for concert in concerts:
        session.add(concert)
    session.commit()
    for concert in concerts:
        session.refresh(concert)
    return concerts
