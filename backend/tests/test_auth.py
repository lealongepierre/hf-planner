import pytest
from app.models import User
from app.schemas.auth import SignInRequest, SignUpRequest, TokenResponse
from fastapi.testclient import TestClient


@pytest.mark.parametrize(
    "test_id,expected_status,request_data",
    [
        pytest.param(
            test_id="valid_new_user",
            expected_status=201,
            request_data=SignUpRequest(username="newuser", password="password123"),
        ),
        pytest.param(
            test_id="short_username",
            expected_status=422,
            request_data=SignUpRequest.model_construct(username="ab", password="password123"),
        ),
        pytest.param(
            test_id="short_password",
            expected_status=422,
            request_data=SignUpRequest.model_construct(username="newuser", password="12345"),
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
            test_id="valid_existing_user",
            expected_status=200,
            request_data=SignInRequest(username="testuser", password="testpassword123"),
        ),
        pytest.param(
            test_id="wrong_password",
            expected_status=401,
            request_data=SignInRequest(username="testuser", password="wrongpassword"),
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
