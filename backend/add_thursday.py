import os

from sqlmodel import Session, create_engine

from app.models import Concert

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Add a few Thursday concerts
    thursday_concerts = [
        Concert(
            band_name="Architects",
            festival_day="Thursday",
            day="Thursday",
            start_time="15:00:00",
            end_time="16:00:00",
            stage="Valley",
        ),
        Concert(
            band_name="Bring Me The Horizon",
            festival_day="Thursday",
            day="Thursday",
            start_time="19:00:00",
            end_time="20:30:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Parkway Drive",
            festival_day="Thursday",
            day="Thursday",
            start_time="21:00:00",
            end_time="22:30:00",
            stage="Mainstage 2",
        ),
    ]

    for concert in thursday_concerts:
        session.add(concert)

    session.commit()
    print(f"Added {len(thursday_concerts)} Thursday concerts")
