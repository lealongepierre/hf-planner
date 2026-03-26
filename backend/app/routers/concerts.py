from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from app.core.config import settings
from app.core.dependencies import get_current_user
from app.database.connection import get_session
from app.models import Concert, User
from app.schemas.concert import ConcertResponse

router = APIRouter(prefix="/api/v1/concerts", tags=["Concerts"])


class RatingUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=0, le=20)


@router.get("", response_model=list[ConcertResponse])
def get_concerts(
    day: str | None = Query(None, description="Filter by festival day"),
    stage: str | None = Query(None, description="Filter by stage"),
    session: Session = Depends(get_session),
):
    statement = select(Concert)

    if day:
        statement = statement.where(
            (Concert.festival_day == day)
            | ((Concert.festival_day.is_(None)) & (Concert.day == day))  # type: ignore[union-attr]
        )
    if stage:
        statement = statement.where(Concert.stage == stage)

    statement = statement.order_by(Concert.band_name)

    concerts = session.exec(statement).all()
    return concerts


@router.get("/{concert_id}", response_model=ConcertResponse)
def get_concert(concert_id: int, session: Session = Depends(get_session)):
    concert = session.get(Concert, concert_id)

    if not concert:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Concert not found",
        )

    return concert


@router.patch("/{concert_id}/rating", response_model=ConcertResponse)
def update_concert_rating(
    concert_id: int,
    body: RatingUpdate,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user.username != settings.RATER_USERNAME:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    concert = session.get(Concert, concert_id)
    if not concert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Concert not found")

    concert.rating = body.rating
    session.add(concert)
    session.commit()
    session.refresh(concert)
    return concert
