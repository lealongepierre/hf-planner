"""Add favorites_public to users

Revision ID: 003
Revises: 002
Create Date: 2025-11-13

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users", sa.Column("favorites_public", sa.Boolean(), nullable=False, server_default="false")
    )
    op.create_index(op.f("ix_users_favorites_public"), "users", ["favorites_public"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_users_favorites_public"), table_name="users")
    op.drop_column("users", "favorites_public")
