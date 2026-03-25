from datetime import time

from pydantic import BaseModel, ConfigDict


class ConcertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    band_name: str
    day: str
    festival_day: str | None
    start_time: time
    end_time: time
    stage: str
    rating: int | None
