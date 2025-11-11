from datetime import datetime, time

from sqlmodel import Field, SQLModel


class Concert(SQLModel, table=True):
    __tablename__ = "concerts"

    id: int | None = Field(default=None, primary_key=True)
    band_name: str = Field(index=True)
    day: str = Field(index=True)
    start_time: time
    end_time: time
    stage: str = Field(index=True)
