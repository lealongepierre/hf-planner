import os

from app.models import Concert, Favorite
from sqlmodel import Session, create_engine, select

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Remove concerts that overlap on the SAME stage
    # Keep the original concerts, remove the newly added ones that conflict

    bands_to_remove = [
        # Remove the newly added concerts that overlap with existing ones
        "Gojira",  # Overlaps with Metallica on Mainstage 1
        "Tool",  # Overlaps with Judas Priest on Mainstage 1
        "Deftones",  # Overlaps with Black Sabbath on Mainstage 2
        "Meshuggah",  # Overlaps with System of a Down on Mainstage 1
        "Mastodon",  # Part of the overlap example set
        "Opeth",  # Part of the overlap example set
        "Lamb of God",  # Part of the overlap example set
        "Gwar",  # Part of the overlap example set
    ]

    # First delete favorites referencing these concerts
    for band in bands_to_remove:
        stmt = select(Concert).where(Concert.band_name == band)
        concerts = session.exec(stmt).all()
        for concert in concerts:
            fav_stmt = select(Favorite).where(Favorite.concert_id == concert.id)
            favorites = session.exec(fav_stmt).all()
            for fav in favorites:
                session.delete(fav)

    session.commit()

    # Now delete the concerts
    for band in bands_to_remove:
        stmt = select(Concert).where(Concert.band_name == band)
        concerts = session.exec(stmt).all()
        for concert in concerts:
            session.delete(concert)

    session.commit()
    print(f"Removed {len(bands_to_remove)} bands that were overlapping on same stages")
    print("\nRemoved bands:", ", ".join(bands_to_remove))
    print("\nNow all concerts on the same stage should have at least 5 minutes buffer between them")
