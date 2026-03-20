import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.models import User
from app.schemas.auth import SignInRequest, SignUpRequest, TokenResponse


@pytest.mark.parametrize(
    "test_id,expected_status,request_data",
    [
        pytest.param(
            "valid_new_user",
            201,
            SignUpRequest(username="newuser", password="password123"),
            id="valid_new_user",
        ),
        pytest.param(
            "short_username",
            422,
            SignUpRequest.model_construct(username="ab", password="password123"),
            id="short_username",
        ),
        pytest.param(
            "short_password",
            422,
            SignUpRequest.model_construct(username="newuser", password="12345"),
            id="short_password",
        ),
    ],
)
def test_signup(
    client: TestClient,
    test_id: str,
    expected_status: int,
    request_data: SignUpRequest,
):
    """Test signup endpoint without existing user.

    - Valid credentials return 201 with user data (no password exposed)
    - Username less than 3 characters returns 422 validation error
    - Password less than 6 characters returns 422 validation error
    """
    response = client.post(
        "/api/v1/auth/signup",
        json=request_data.model_dump(),
    )
    assert response.status_code == expected_status

    if test_id == "valid_new_user":
        data = response.json()
        assert data["username"] == "newuser"
        assert "id" in data
        assert "password" not in data


def test_signup_with_existing_user(client: TestClient, test_user: User):
    """Test signup with duplicate username.

    - Duplicate username returns 400 with error message
    """
    request_data = SignUpRequest(username="testuser", password="password123")
    response = client.post(
        "/api/v1/auth/signup",
        json=request_data.model_dump(),
    )
    assert response.status_code == 400
    data = response.json()
    assert "already registered" in data["detail"].lower()


@pytest.mark.parametrize(
    "test_id,expected_status,request_data",
    [
        pytest.param(
            "valid_existing_user",
            200,
            SignInRequest(username="testuser", password="testpassword123"),
            id="valid_existing_user",
        ),
        pytest.param(
            "wrong_password",
            401,
            SignInRequest(username="testuser", password="wrongpassword"),
            id="wrong_password",
        ),
    ],
)
def test_signin(
    client: TestClient,
    test_user: User,
    test_id: str,
    expected_status: int,
    request_data: SignInRequest,
):
    """Test signin endpoint with existing user.

    - Valid credentials return 200 with JWT access token
    - Wrong password returns 401 with error message
    """
    response = client.post(
        "/api/v1/auth/signin",
        json=request_data.model_dump(),
    )
    assert response.status_code == expected_status

    data = response.json()

    if test_id == "valid_existing_user":
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert len(data["access_token"]) > 0
    elif test_id == "wrong_password":
        assert "incorrect" in data["detail"].lower()


def test_signin_nonexistent_user(client: TestClient):
    """Test signin with nonexistent user.

    - Nonexistent user returns 401 unauthorized
    """
    request_data = SignInRequest(username="nonexistent", password="password123")
    response = client.post(
        "/api/v1/auth/signin",
        json=request_data.model_dump(),
    )
    assert response.status_code == 401


def test_signin_token_is_valid_jwt(client: TestClient, test_user: User):
    """Test that signin returns a valid JWT token structure.

    - Token should have 3 parts separated by dots (header.payload.signature)
    """
    request_data = SignInRequest(username="testuser", password="testpassword123")
    response = client.post(
        "/api/v1/auth/signin",
        json=request_data.model_dump(),
    )
    token_response = TokenResponse.model_validate(response.json())
    assert token_response.access_token.count(".") == 2


@pytest.mark.parametrize(
    "test_id,access_code_setting,request_code,expected_status",
    [
        pytest.param(
            "correct_code",
            "hellfest2025",
            "hellfest2025",
            201,
            id="correct_code",
        ),
        pytest.param(
            "wrong_code",
            "hellfest2025",
            "wrongcode",
            403,
            id="wrong_code",
        ),
        pytest.param(
            "missing_code_when_required",
            "hellfest2025",
            None,
            403,
            id="missing_code_when_required",
        ),
        pytest.param(
            "no_code_required",
            None,
            None,
            201,
            id="no_code_required",
        ),
    ],
)
def test_signup_access_code(
    client: TestClient,
    monkeypatch: pytest.MonkeyPatch,
    test_id: str,
    access_code_setting: str | None,
    request_code: str | None,
    expected_status: int,
):
    """Test signup access code validation.

    - Correct access code returns 201
    - Wrong access code returns 403
    - Missing access code when required returns 403
    - No access code required (setting is None) returns 201
    """
    monkeypatch.setattr(settings, "SIGNUP_ACCESS_CODE", access_code_setting)

    request_data = {
        "username": f"user_{test_id}",
        "password": "password123",
    }
    if request_code is not None:
        request_data["access_code"] = request_code

    response = client.post("/api/v1/auth/signup", json=request_data)
    assert response.status_code == expected_status

    if expected_status == 403:
        assert "invalid access code" in response.json()["detail"].lower()
    elif expected_status == 201:
        assert response.json()["username"] == f"user_{test_id}"
