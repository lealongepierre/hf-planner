import os

from app.models import Concert, Favorite
from sqlmodel import Session, create_engine, select

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Fix 1: Remove Pantera (overlaps with Megadeth)
    stmt = select(Concert).where(Concert.band_name == "Pantera")
    pantera = session.exec(stmt).first()
    if pantera:
        # Delete favorites first
        fav_stmt = select(Favorite).where(Favorite.concert_id == pantera.id)
        favorites = session.exec(fav_stmt).all()
        for fav in favorites:
            session.delete(fav)
        session.delete(pantera)
        print("✅ Removed Pantera (overlapped with Megadeth)")

    # Fix 2: Remove Sepultura (overlaps with Sodom)
    stmt = select(Concert).where(Concert.band_name == "Sepultura")
    sepultura = session.exec(stmt).first()
    if sepultura:
        # Delete favorites first
        fav_stmt = select(Favorite).where(Favorite.concert_id == sepultura.id)
        favorites = session.exec(fav_stmt).all()
        for fav in favorites:
            session.delete(fav)
        session.delete(sepultura)
        print("✅ Removed Sepultura (overlapped with Sodom)")

    # Fix 3: Adjust Thursday Valley Early to end at 14:40 (5 min before Architects)
    stmt = select(Concert).where(
        Concert.band_name == "Thursday Valley Early", Concert.stage == "Valley"
    )
    thursday_valley = session.exec(stmt).first()
    if thursday_valley:
        thursday_valley.start_time = "13:45:00"
        thursday_valley.end_time = "14:55:00"  # Ends at 14:55, Architects starts at 15:00
        print("✅ Adjusted Thursday Valley Early to 13:45-14:55 (5 min buffer before Architects)")

    # Fix 4: Adjust Machine Head to end at 18:40 (5 min before Anthrax)
    stmt = select(Concert).where(Concert.band_name == "Machine Head", Concert.stage == "Warzone")
    machine_head = session.exec(stmt).first()
    if machine_head:
        machine_head.end_time = "18:40:00"  # Ends at 18:40, Anthrax starts at 18:45
        print("✅ Adjusted Machine Head to end at 18:40 (5 min buffer before Anthrax)")

    session.commit()
    print("\n✨ All overlaps and buffer issues fixed!")
    print("\nRemaining 3-way overlap examples (on DIFFERENT stages):")
    print("- Friday: Testament (Valley) 15:00-16:00")
    print("         Exodus (Warzone) 15:30-16:30")
    print("         Slayer (Mainstage 2) 16:00-17:00")
    print("- Saturday: Megadeth (Mainstage 1) 18:00-19:30")
    print("           Anthrax (Warzone) 18:45-20:00")
    print("           Overkill (Valley) 19:30-20:45")
    print("- Sunday: Kreator (Warzone) 14:00-15:00")
    print("         Sodom (Valley) 14:30-15:30")
    print("         Destruction (Altar) 15:00-16:00")
