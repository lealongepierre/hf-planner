from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_user
from app.database.connection import get_session
from app.models import Concert, Favorite, User
from app.schemas.concert import ConcertResponse
from app.schemas.user import (
    FavoritesVisibilityResponse,
    FavoritesVisibilityUpdate,
    UserListResponse,
)

router = APIRouter(prefix="/api/v1/users", tags=["Users"])


@router.get("", response_model=list[UserListResponse])
def list_users(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(User)
    users = session.exec(statement).all()
    return users


@router.patch("/me/favorites-visibility", response_model=FavoritesVisibilityResponse)
def update_favorites_visibility(
    update: FavoritesVisibilityUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    current_user.favorites_public = update.public
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user


@router.get("/{username}/favorites", response_model=list[ConcertResponse])
def get_user_favorites(
    username: str,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(User).where(User.username == username)
    user = session.exec(statement).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if not user.favorites_public and user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User's favorites are private",
        )

    statement = (
        select(Concert)
        .join(Favorite, Favorite.concert_id == Concert.id)  # type: ignore[arg-type]
        .where(Favorite.user_id == user.id)
    )
    concerts = session.exec(statement).all()
    return concerts
