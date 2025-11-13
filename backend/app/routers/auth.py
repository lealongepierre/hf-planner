from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.security import create_access_token, get_password_hash, verify_password
from app.database.connection import get_session
from app.models import User
from app.schemas.auth import SignInRequest, SignUpRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignUpRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == request.username)
    existing_user = session.exec(statement).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered",
        )

    hashed_password = get_password_hash(request.password)
    new_user = User(username=request.username, hashed_password=hashed_password)

    session.add(new_user)
    session.commit()
    session.refresh(new_user)

    return UserResponse(id=new_user.id, username=new_user.username)


@router.post("/signin", response_model=TokenResponse)
def signin(request: SignInRequest, session: Session = Depends(get_session)):
    statement = select(User).where(User.username == request.username)
    user = session.exec(statement).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(access_token=access_token)
