from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select

from app.database.connection import get_session
from app.models import Concert
from app.schemas.concert import ConcertResponse

router = APIRouter(prefix="/api/v1/concerts", tags=["Concerts"])


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
