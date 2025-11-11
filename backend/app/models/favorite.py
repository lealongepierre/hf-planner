from sqlmodel import Field, SQLModel, UniqueConstraint


class Favorite(SQLModel, table=True):
    __tablename__ = "favorites"
    __table_args__ = (UniqueConstraint("user_id", "concert_id", name="unique_user_concert"),)

    id: int | None = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    concert_id: int = Field(foreign_key="concerts.id", index=True)
