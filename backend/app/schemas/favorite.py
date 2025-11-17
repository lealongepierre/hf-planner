from pydantic import BaseModel, ConfigDict

from app.schemas.concert import ConcertResponse


class FavoriteCreate(BaseModel):
    concert_id: int


class FavoriteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    concert_id: int


class FavoriteWithConcert(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    concert: ConcertResponse
