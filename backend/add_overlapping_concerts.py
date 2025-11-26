import os

from app.models import Concert
from sqlmodel import Session, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Add overlapping concerts to demonstrate the overlap algorithm
    overlapping_concerts = [
        # Group 1: Three concerts that all overlap (like Testament, Exodus, Slayer example)
        Concert(
            band_name="Testament",
            festival_day="Friday",
            day="Friday",
            start_time="15:00:00",
            end_time="16:00:00",
            stage="Valley",
        ),
        Concert(
            band_name="Exodus",
            festival_day="Friday",
            day="Friday",
            start_time="15:30:00",
            end_time="16:30:00",
            stage="Valley",
        ),
        Concert(
            band_name="Slayer",
            festival_day="Friday",
            day="Friday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Valley",
        ),
        # Group 2: Two concerts that overlap on Saturday
        Concert(
            band_name="Megadeth",
            festival_day="Saturday",
            day="Saturday",
            start_time="18:00:00",
            end_time="19:30:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Anthrax",
            festival_day="Saturday",
            day="Saturday",
            start_time="18:45:00",
            end_time="20:00:00",
            stage="Mainstage 1",
        ),
        # Group 3: Four concerts with complex overlapping on Sunday
        Concert(
            band_name="Kreator",
            festival_day="Sunday",
            day="Sunday",
            start_time="14:00:00",
            end_time="15:00:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Sodom",
            festival_day="Sunday",
            day="Sunday",
            start_time="14:30:00",
            end_time="15:30:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Destruction",
            festival_day="Sunday",
            day="Sunday",
            start_time="15:00:00",
            end_time="16:00:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Overkill",
            festival_day="Sunday",
            day="Sunday",
            start_time="15:30:00",
            end_time="16:30:00",
            stage="Warzone",
        ),
    ]

    for concert in overlapping_concerts:
        session.add(concert)

    session.commit()
    print(f"Added {len(overlapping_concerts)} overlapping concerts")
    print("\nOverlap examples added:")
    print("- Friday (Valley): Testament → Exodus → Slayer (3-way overlap)")
    print("- Saturday (Mainstage 1): Megadeth ↔ Anthrax (2-way overlap)")
    print("- Sunday (Warzone): Kreator → Sodom → Destruction → Overkill (4-way overlap)")
