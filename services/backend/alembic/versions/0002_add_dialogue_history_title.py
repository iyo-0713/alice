"""Add title to dialogue_histories.

Revision ID: 0002_add_dialogue_history_title
Revises: 0001_create_dialogue_histories
Create Date: 2025-01-02 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0002_add_dialogue_history_title"
down_revision = "0001_create_dialogue_histories"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add title column to dialogue_histories table."""
    op.execute("ALTER TABLE dialogue_histories ADD COLUMN title TEXT")


def downgrade() -> None:
    """Drop title column from dialogue_histories table."""
    op.execute("ALTER TABLE dialogue_histories DROP COLUMN title")
