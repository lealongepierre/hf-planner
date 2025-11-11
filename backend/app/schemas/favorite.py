from pydantic import BaseModel

from app.schemas.concert import ConcertResponse


class FavoriteCreate(BaseModel):
    concert_id: int


class FavoriteResponse(BaseModel):
    id: int
    user_id: int
    concert_id: int

    class Config:
        from_attributes = True


class FavoriteWithConcert(BaseModel):
    id: int
    concert: ConcertResponse

    class Config:
        from_attributes = True
