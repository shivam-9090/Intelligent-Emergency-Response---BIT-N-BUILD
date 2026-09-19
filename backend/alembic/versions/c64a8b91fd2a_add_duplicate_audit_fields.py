"""add duplicate audit fields

Revision ID: c64a8b91fd2a
Revises: b9ab06b5b1b5
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op


revision: str = "c64a8b91fd2a"
down_revision: Union[str, None] = "b9ab06b5b1b5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("incidents", sa.Column("duplicate_score", sa.Float(), nullable=True))
    op.add_column("incidents", sa.Column("duplicate_reason", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("incidents", "duplicate_reason")
    op.drop_column("incidents", "duplicate_score")
