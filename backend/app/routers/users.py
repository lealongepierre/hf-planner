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
    """
    List all users with their public/private favorites status.

    Returns user IDs, usernames, and whether their favorites are public or private.
    This endpoint helps users discover which other users have made their favorites
    public for sharing and coordination purposes.

    Requires authentication to prevent anonymous access to user information.
    """
    statement = select(User)
    users = session.exec(statement).all()
    return users


@router.patch("/me/favorites-visibility", response_model=FavoritesVisibilityResponse)
def update_favorites_visibility(
    update: FavoritesVisibilityUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """
    Toggle the current user's favorites visibility between public and private.

    By default, user favorites are private. Setting public=True allows other
    authenticated users to view your favorites via the GET /{username}/favorites
    endpoint, enabling schedule coordination and calendar overlay features.

    Privacy is opt-in: users must explicitly make their favorites public.
    """
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
    """
    Retrieve a user's favorite concerts by username.

    Privacy enforcement:
    - If the target user has favorites_public=True, any authenticated user can view
    - If the target user has favorites_public=False, only they can view their own favorites
    - Returns 404 if user doesn't exist
    - Returns 403 if trying to access another user's private favorites

    Users can always access their own favorites regardless of privacy setting.
    This enables calendar overlay features where users can see their friends' schedules.

    Implementation note: Uses SQLAlchemy join to fetch concerts through the favorites
    relationship. The type ignore comment is needed due to SQLAlchemy/SQLModel type
    compatibility issues with the join condition.
    """
    user_statement = select(User).where(User.username == username)
    user = session.exec(user_statement).first()

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

    concerts_statement = (
        select(Concert)
        .join(Favorite, Favorite.concert_id == Concert.id)  # type: ignore[arg-type]
        .where(Favorite.user_id == user.id)
    )
    concerts = session.exec(concerts_statement).all()
    return concerts
