"""Initial migration

Revision ID: 001
Revises:
Create Date: 2025-11-11

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    # Create concerts table
    op.create_table(
        "concerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("band_name", sa.String(), nullable=False),
        sa.Column("day", sa.String(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("stage", sa.String(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_concerts_band_name"), "concerts", ["band_name"], unique=False)
    op.create_index(op.f("ix_concerts_day"), "concerts", ["day"], unique=False)
    op.create_index(op.f("ix_concerts_stage"), "concerts", ["stage"], unique=False)

    # Create favorites table
    op.create_table(
        "favorites",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("concert_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(
            ["concert_id"],
            ["concerts.id"],
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "concert_id", name="unique_user_concert"),
    )
    op.create_index(op.f("ix_favorites_concert_id"), "favorites", ["concert_id"], unique=False)
    op.create_index(op.f("ix_favorites_user_id"), "favorites", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_favorites_user_id"), table_name="favorites")
    op.drop_index(op.f("ix_favorites_concert_id"), table_name="favorites")
    op.drop_table("favorites")
    op.drop_index(op.f("ix_concerts_stage"), table_name="concerts")
    op.drop_index(op.f("ix_concerts_day"), table_name="concerts")
    op.drop_index(op.f("ix_concerts_band_name"), table_name="concerts")
    op.drop_table("concerts")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_table("users")
