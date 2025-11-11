from datetime import time

from pydantic import BaseModel


class ConcertResponse(BaseModel):
    id: int
    band_name: str
    day: str
    start_time: time
    end_time: time
    stage: str

    class Config:
        from_attributes = True
