from pydantic import BaseModel, ConfigDict, Field


class UserListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    favorites_public: bool = Field(description="Whether the user's favorites are publicly visible")


class FavoritesVisibilityUpdate(BaseModel):
    public: bool = Field(
        description="Set to true to make favorites public, false to make them private"
    )


class FavoritesVisibilityResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    favorites_public: bool = Field(description="Whether the user's favorites are publicly visible")
