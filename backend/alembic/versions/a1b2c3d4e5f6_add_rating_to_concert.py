"""add_rating_to_concert

Revision ID: a1b2c3d4e5f6
Revises: 3790bfd154bc
Create Date: 2026-03-25 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = "a1b2c3d4e5f6"
down_revision = "3790bfd154bc"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("concerts", sa.Column("rating", sa.Integer(), nullable=True))


def downgrade() -> None:
    op.drop_column("concerts", "rating")
