import os

from app.models import Concert
from sqlmodel import Session, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Add concerts on DIFFERENT stages at overlapping times
    # These will only overlap in the favorites view when showing all days together
    # Each stage respects the 5-minute buffer rule

    correct_overlapping_concerts = [
        # Friday - Different stages, overlapping times (for favorites view)
        Concert(
            band_name="Gojira",
            festival_day="Friday",
            day="Friday",
            start_time="20:00:00",
            end_time="21:15:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Mastodon",
            festival_day="Friday",
            day="Friday",
            start_time="20:30:00",
            end_time="21:45:00",
            stage="Warzone",  # Different stage!
        ),
        Concert(
            band_name="Opeth",
            festival_day="Friday",
            day="Friday",
            start_time="21:00:00",
            end_time="22:15:00",
            stage="Valley",  # Different stage!
        ),
        # Saturday - Different stages, overlapping times
        Concert(
            band_name="Tool",
            festival_day="Saturday",
            day="Saturday",
            start_time="21:30:00",
            end_time="23:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Deftones",
            festival_day="Saturday",
            day="Saturday",
            start_time="22:00:00",
            end_time="23:15:00",
            stage="Mainstage 2",  # Different stage!
        ),
        # Sunday - More complex overlapping on different stages
        Concert(
            band_name="Meshuggah",
            festival_day="Sunday",
            day="Sunday",
            start_time="19:00:00",
            end_time="20:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Lamb of God",
            festival_day="Sunday",
            day="Sunday",
            start_time="19:30:00",
            end_time="20:30:00",
            stage="Warzone",  # Different stage!
        ),
        Concert(
            band_name="Gwar",
            festival_day="Sunday",
            day="Sunday",
            start_time="19:45:00",
            end_time="20:45:00",
            stage="Valley",  # Different stage!
        ),
    ]

    for concert in correct_overlapping_concerts:
        session.add(concert)

    session.commit()
    print(
        f"Added {len(correct_overlapping_concerts)} concerts with overlapping times "
        "on different stages"
    )
    print("\nTo see the overlap behavior:")
    print("1. Go to the Concerts page and add these to your favorites:")
    print("   - Friday: Gojira, Mastodon, Opeth (overlap 20:30-21:00)")
    print("   - Saturday: Tool, Deftones (overlap 22:00-23:00)")
    print("   - Sunday: Meshuggah, Lamb of God, Gwar (overlap 19:45-20:00)")
    print("2. Go to Calendar page and select 'My Favorites' view")
    print("3. You'll see them displayed side-by-side in columns!")
