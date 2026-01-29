from datetime import time

from sqlalchemy import func
from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import Concert

engine = create_engine(settings.DATABASE_URL)

concerts_data = [
    {
        "band_name": "Metallica",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Iron Maiden",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "Slayer",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Megadeth",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "Altar",
    },
    {
        "band_name": "Anthrax",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "Warzone",
    },
    {
        "band_name": "Testament",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "Temple",
    },
    {
        "band_name": "Exodus",
        "day": "Friday",
        "festival_day": "Friday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "Valley",
    },
    {
        "band_name": "Electric Wizard",
        "day": "Saturday",
        "festival_day": "Friday",
        "start_time": time(1, 0),
        "end_time": time(2, 30),
        "stage": "Temple",
    },
    {
        "band_name": "Sleep",
        "day": "Saturday",
        "festival_day": "Friday",
        "start_time": time(2, 45),
        "end_time": time(4, 0),
        "stage": "Altar",
    },
    {
        "band_name": "Judas Priest",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Black Sabbath",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "Pantera",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Gojira",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "Altar",
    },
    {
        "band_name": "Machine Head",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "Warzone",
    },
    {
        "band_name": "Lamb of God",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "Temple",
    },
    {
        "band_name": "Opeth",
        "day": "Saturday",
        "festival_day": "Saturday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "Valley",
    },
    {
        "band_name": "Sunn O)))",
        "day": "Sunday",
        "festival_day": "Saturday",
        "start_time": time(1, 30),
        "end_time": time(3, 0),
        "stage": "Temple",
    },
    {
        "band_name": "Boris",
        "day": "Sunday",
        "festival_day": "Saturday",
        "start_time": time(3, 15),
        "end_time": time(4, 30),
        "stage": "Altar",
    },
    {
        "band_name": "Slipknot",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(21, 0),
        "end_time": time(23, 0),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Tool",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(21, 30),
        "end_time": time(23, 30),
        "stage": "Mainstage 2",
    },
    {
        "band_name": "System of a Down",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(19, 0),
        "end_time": time(20, 30),
        "stage": "Mainstage 1",
    },
    {
        "band_name": "Korn",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(19, 30),
        "end_time": time(21, 0),
        "stage": "Altar",
    },
    {
        "band_name": "Deftones",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(17, 30),
        "end_time": time(18, 45),
        "stage": "Warzone",
    },
    {
        "band_name": "Mastodon",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(16, 0),
        "end_time": time(17, 15),
        "stage": "Temple",
    },
    {
        "band_name": "Sepultura",
        "day": "Sunday",
        "festival_day": "Sunday",
        "start_time": time(15, 0),
        "end_time": time(16, 0),
        "stage": "Valley",
    },
    {
        "band_name": "Melvins",
        "day": "Monday",
        "festival_day": "Sunday",
        "start_time": time(0, 30),
        "end_time": time(2, 0),
        "stage": "Temple",
    },
    {
        "band_name": "Neurosis",
        "day": "Monday",
        "festival_day": "Sunday",
        "start_time": time(2, 15),
        "end_time": time(3, 30),
        "stage": "Altar",
    },
]


def seed_concerts():
    with Session(engine) as session:
        # Count existing concerts efficiently using database-level count
        statement = select(func.count()).select_from(Concert)
        existing_concerts = session.exec(statement).one()

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
