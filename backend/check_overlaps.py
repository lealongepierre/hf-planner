import os
from datetime import datetime

from app.models import Concert
from sqlmodel import Session, create_engine, select

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://hfplanner:hfplanner@localhost:5432/hfplanner"
)

engine = create_engine(DATABASE_URL)

with Session(engine) as session:
    stmt = select(Concert).order_by(Concert.festival_day, Concert.stage, Concert.start_time)
    concerts = session.exec(stmt).all()

    # Group by day and stage
    by_day_stage = {}
    for concert in concerts:
        day = concert.festival_day or concert.day
        stage = concert.stage
        key = (day, stage)
        if key not in by_day_stage:
            by_day_stage[key] = []
        by_day_stage[key].append(concert)

    # Check for overlaps on same stage
    print("Checking for overlaps on same stage...\n")
    overlaps_found = []
    buffer_issues = []

    for (day, stage), day_concerts in sorted(by_day_stage.items()):
        print(f"{day} - {stage}:")
        for i, concert in enumerate(day_concerts):
            # Convert time to datetime if it's not already
            if isinstance(concert.start_time, str):
                start = datetime.strptime(concert.start_time, "%H:%M:%S")
                end = datetime.strptime(concert.end_time, "%H:%M:%S")
            else:
                start = datetime.combine(datetime.today(), concert.start_time)
                end = datetime.combine(datetime.today(), concert.end_time)

            print(f'  {concert.band_name}: {start.strftime("%H:%M")}-{end.strftime("%H:%M")}')

            # Check overlap with next concert
            if i < len(day_concerts) - 1:
                next_concert = day_concerts[i + 1]
                if isinstance(next_concert.start_time, str):
                    next_start = datetime.strptime(next_concert.start_time, "%H:%M:%S")
                else:
                    next_start = datetime.combine(datetime.today(), next_concert.start_time)

                # Check if there's overlap or insufficient buffer
                if next_start < end:
                    overlap_duration = end - next_start
                    print(f"    ❌ OVERLAPS with {next_concert.band_name} by {overlap_duration}")
                    overlaps_found.append((concert, next_concert, day, stage))
                elif (next_start - end).total_seconds() < 300:  # Less than 5 minutes
                    buffer = (next_start - end).total_seconds() / 60
                    print(f"    ⚠️  Only {buffer:.1f} min buffer before {next_concert.band_name}")
                    buffer_issues.append((concert, next_concert, day, stage, buffer))
        print()

    if overlaps_found:
        print(f"\n🚨 Found {len(overlaps_found)} overlapping concerts on same stage:")
        for concert1, concert2, day, stage in overlaps_found:
            print(f"  {day} {stage}: {concert1.band_name} overlaps with {concert2.band_name}")

    if buffer_issues:
        print(f"\n⚠️  Found {len(buffer_issues)} concerts with insufficient buffer (<5 min):")
        for concert1, concert2, day, stage, buffer in buffer_issues:
            print(
                f"  {day} {stage}: {concert1.band_name} → {concert2.band_name} ({buffer:.1f} min)"
            )
