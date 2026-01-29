"""Add festival_day column to concerts

Revision ID: 002
Revises: 001
Create Date: 2025-11-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import text

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("concerts", sa.Column("festival_day", sa.String(), nullable=True))
    op.create_index(op.f("ix_concerts_festival_day"), "concerts", ["festival_day"], unique=False)

    connection = op.get_bind()
    connection.execute(
        text(
            """
        UPDATE concerts
        SET festival_day = CASE
            WHEN start_time >= '00:00:00' AND start_time < '06:00:00' THEN
                CASE day
                    WHEN 'Monday' THEN 'Sunday'
                    WHEN 'Tuesday' THEN 'Monday'
                    WHEN 'Wednesday' THEN 'Tuesday'
                    WHEN 'Thursday' THEN 'Wednesday'
                    WHEN 'Friday' THEN 'Thursday'
                    WHEN 'Saturday' THEN 'Friday'
                    WHEN 'Sunday' THEN 'Saturday'
                    ELSE day
                END
            ELSE day
        END
    """
        )
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_concerts_festival_day"), table_name="concerts")
    op.drop_column("concerts", "festival_day")
