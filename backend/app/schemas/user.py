from pydantic import BaseModel


class UserListResponse(BaseModel):
    id: int
    username: str
    favorites_public: bool

    class Config:
        from_attributes = True


class FavoritesVisibilityUpdate(BaseModel):
    public: bool


class FavoritesVisibilityResponse(BaseModel):
    username: str
    favorites_public: bool

    class Config:
        from_attributes = True
