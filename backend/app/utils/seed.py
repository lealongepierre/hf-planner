from datetime import time

from sqlmodel import Session, create_engine

from app.core.config import settings
from app.models import Concert

engine = create_engine(settings.DATABASE_URL)

concerts_data = [
    {
        "band_name": "Metallica",
        "day": "Friday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Iron Maiden",
        "day": "Friday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "Slayer",
        "day": "Friday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Megadeth",
        "day": "Friday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "The Altar",
    },
    {
        "band_name": "Anthrax",
        "day": "Friday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "The Warzone",
    },
    {
        "band_name": "Testament",
        "day": "Friday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "The Temple",
    },
    {
        "band_name": "Exodus",
        "day": "Friday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "The Valley",
    },
    {
        "band_name": "Judas Priest",
        "day": "Saturday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Black Sabbath",
        "day": "Saturday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "Pantera",
        "day": "Saturday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Gojira",
        "day": "Saturday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "The Altar",
    },
    {
        "band_name": "Machine Head",
        "day": "Saturday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "The Warzone",
    },
    {
        "band_name": "Lamb of God",
        "day": "Saturday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "The Temple",
    },
    {
        "band_name": "Opeth",
        "day": "Saturday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "The Valley",
    },
    {
        "band_name": "Slipknot",
        "day": "Sunday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Tool",
        "day": "Sunday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "System of a Down",
        "day": "Sunday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Korn",
        "day": "Sunday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "The Altar",
    },
    {
        "band_name": "Deftones",
        "day": "Sunday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "The Warzone",
    },
    {
        "band_name": "Mastodon",
        "day": "Sunday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "The Temple",
    },
    {
        "band_name": "Sepultura",
        "day": "Sunday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "The Valley",
    },
]


def seed_concerts():
    with Session(engine) as session:
        existing_concerts = session.query(Concert).count()
        if existing_concerts > 0:
            print(f"Database already contains {existing_concerts} concerts. Skipping seed.")
            return

        for concert_data in concerts_data:
            concert = Concert(**concert_data)
            session.add(concert)

        session.commit()
        print(f"Successfully seeded {len(concerts_data)} concerts!")


if __name__ == "__main__":
    seed_concerts()
