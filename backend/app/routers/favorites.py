from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.core.dependencies import get_current_user
from app.database.connection import get_session
from app.models import Concert, Favorite, User
from app.schemas.concert import ConcertResponse
from app.schemas.favorite import FavoriteCreate, FavoriteResponse

router = APIRouter(prefix="/api/v1/favorites", tags=["Favorites"])


@router.post("", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    request: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    concert = session.get(Concert, request.concert_id)
    if not concert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concert not found",
        )

    statement = select(Favorite).where(
        Favorite.user_id == current_user.id, Favorite.concert_id == request.concert_id
    )
    existing_favorite = session.exec(statement).first()

    if existing_favorite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Concert already in favorites",
        )

    favorite = Favorite(user_id=current_user.id, concert_id=request.concert_id)
    session.add(favorite)
    session.commit()
    session.refresh(favorite)

    return favorite


@router.delete("/{concert_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    concert_id: int,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = select(Favorite).where(
        Favorite.user_id == current_user.id, Favorite.concert_id == concert_id
    )
    favorite = session.exec(statement).first()

    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found",
        )

    session.delete(favorite)
    session.commit()
    return None


@router.get("", response_model=list[ConcertResponse])
def get_user_favorites(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    statement = (
        select(Concert)
        .join(Favorite, Favorite.concert_id == Concert.id)  # type: ignore[arg-type]
        .where(Favorite.user_id == current_user.id)
    )
    concerts = session.exec(statement).all()
    return concerts
