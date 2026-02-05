import os

from sqlmodel import Session, create_engine

from app.models import Concert

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    # Comprehensive schedule with overlapping concerts on DIFFERENT stages
    # Each stage respects the 5-minute buffer rule
    # Includes the Testament/Exodus/Slayer pattern on different stages

    comprehensive_schedule = [
        # ========== THURSDAY ==========
        # All stages active
        Concert(
            band_name="Thursday Mainstage 1 Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="14:00:00",
            end_time="15:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Thursday Mainstage 2 Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="14:30:00",
            end_time="15:30:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Thursday Warzone Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="14:15:00",
            end_time="15:15:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Thursday Valley Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="14:45:00",
            end_time="15:45:00",
            stage="Valley",
        ),
        Concert(
            band_name="Thursday Altar Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Altar",
        ),
        Concert(
            band_name="Thursday Temple Early",
            festival_day="Thursday",
            day="Thursday",
            start_time="16:30:00",
            end_time="17:30:00",
            stage="Temple",
        ),
        # ========== FRIDAY ==========
        # Testament/Exodus/Slayer pattern on DIFFERENT stages (3-way overlap)
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
            stage="Warzone",  # Different stage!
        ),
        Concert(
            band_name="Slayer",
            festival_day="Friday",
            day="Friday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Mainstage 2",  # Different stage!
        ),
        # Fill other stages for Friday
        Concert(
            band_name="Friday Mainstage 1 Early",
            festival_day="Friday",
            day="Friday",
            start_time="14:00:00",
            end_time="15:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Friday Altar Mid",
            festival_day="Friday",
            day="Friday",
            start_time="15:30:00",
            end_time="16:30:00",
            stage="Altar",
        ),
        Concert(
            band_name="Friday Temple Mid",
            festival_day="Friday",
            day="Friday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Temple",
        ),
        # Later Friday concerts on all stages
        Concert(
            band_name="Friday Mainstage 1 Late",
            festival_day="Friday",
            day="Friday",
            start_time="18:00:00",
            end_time="19:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Friday Mainstage 2 Late",
            festival_day="Friday",
            day="Friday",
            start_time="18:30:00",
            end_time="19:30:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Friday Warzone Late",
            festival_day="Friday",
            day="Friday",
            start_time="18:15:00",
            end_time="19:15:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Friday Valley Late",
            festival_day="Friday",
            day="Friday",
            start_time="18:45:00",
            end_time="19:45:00",
            stage="Valley",
        ),
        Concert(
            band_name="Friday Altar Late",
            festival_day="Friday",
            day="Friday",
            start_time="19:00:00",
            end_time="20:00:00",
            stage="Altar",
        ),
        Concert(
            band_name="Friday Temple Late",
            festival_day="Friday",
            day="Friday",
            start_time="19:30:00",
            end_time="20:30:00",
            stage="Temple",
        ),
        # ========== SATURDAY ==========
        # Another 3-way overlap example
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
            stage="Warzone",  # Different stage!
        ),
        Concert(
            band_name="Overkill",
            festival_day="Saturday",
            day="Saturday",
            start_time="19:30:00",
            end_time="20:45:00",
            stage="Valley",  # Different stage!
        ),
        # Fill other stages for Saturday
        Concert(
            band_name="Saturday Mainstage 2 Early",
            festival_day="Saturday",
            day="Saturday",
            start_time="14:00:00",
            end_time="15:00:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Saturday Altar Early",
            festival_day="Saturday",
            day="Saturday",
            start_time="14:30:00",
            end_time="15:30:00",
            stage="Altar",
        ),
        Concert(
            band_name="Saturday Temple Early",
            festival_day="Saturday",
            day="Saturday",
            start_time="15:00:00",
            end_time="16:00:00",
            stage="Temple",
        ),
        # More Saturday concerts
        Concert(
            band_name="Saturday Mainstage 2 Late",
            festival_day="Saturday",
            day="Saturday",
            start_time="17:00:00",
            end_time="18:00:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Saturday Altar Late",
            festival_day="Saturday",
            day="Saturday",
            start_time="17:30:00",
            end_time="18:30:00",
            stage="Altar",
        ),
        Concert(
            band_name="Saturday Temple Late",
            festival_day="Saturday",
            day="Saturday",
            start_time="18:00:00",
            end_time="19:00:00",
            stage="Temple",
        ),
        # ========== SUNDAY ==========
        # Complex 3-way overlap
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
            stage="Valley",  # Different stage!
        ),
        Concert(
            band_name="Destruction",
            festival_day="Sunday",
            day="Sunday",
            start_time="15:00:00",
            end_time="16:00:00",
            stage="Altar",  # Different stage!
        ),
        # Fill other stages for Sunday
        Concert(
            band_name="Sunday Mainstage 1 Early",
            festival_day="Sunday",
            day="Sunday",
            start_time="13:00:00",
            end_time="14:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Sunday Mainstage 2 Early",
            festival_day="Sunday",
            day="Sunday",
            start_time="13:30:00",
            end_time="14:30:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Sunday Temple Early",
            festival_day="Sunday",
            day="Sunday",
            start_time="14:00:00",
            end_time="15:00:00",
            stage="Temple",
        ),
        # Later Sunday concerts
        Concert(
            band_name="Sunday Mainstage 1 Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Mainstage 1",
        ),
        Concert(
            band_name="Sunday Mainstage 2 Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="16:30:00",
            end_time="17:30:00",
            stage="Mainstage 2",
        ),
        Concert(
            band_name="Sunday Warzone Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="16:00:00",
            end_time="17:00:00",
            stage="Warzone",
        ),
        Concert(
            band_name="Sunday Valley Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="16:30:00",
            end_time="17:30:00",
            stage="Valley",
        ),
        Concert(
            band_name="Sunday Altar Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="17:00:00",
            end_time="18:00:00",
            stage="Altar",
        ),
        Concert(
            band_name="Sunday Temple Late",
            festival_day="Sunday",
            day="Sunday",
            start_time="17:30:00",
            end_time="18:30:00",
            stage="Temple",
        ),
    ]

    for concert in comprehensive_schedule:
        session.add(concert)

    session.commit()
    print(f"Added {len(comprehensive_schedule)} concerts to create comprehensive schedule")
    print("\n3-way overlap examples (on DIFFERENT stages):")
    print("- Friday: Testament (Valley) → Exodus (Warzone) → Slayer (Mainstage 2)")
    print("  Testament 15:00-16:00, Exodus 15:30-16:30, Slayer 16:00-17:00")
    print("- Saturday: Megadeth (Mainstage 1) → Anthrax (Warzone) → Overkill (Valley)")
    print("  Megadeth 18:00-19:30, Anthrax 18:45-20:00, Overkill 19:30-20:45")
    print("- Sunday: Kreator (Warzone) → Sodom (Valley) → Destruction (Altar)")
    print("  Kreator 14:00-15:00, Sodom 14:30-15:30, Destruction 15:00-16:00")
    print("\nAll stages now have concerts on each day!")
    print("\nTo see the overlaps:")
    print("1. Add these overlapping concerts to your favorites")
    print("2. Go to Calendar page → 'My Favorites' view")
    print("3. They'll be displayed side-by-side in columns!")
