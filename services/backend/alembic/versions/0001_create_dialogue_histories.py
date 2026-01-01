"""Create dialogue_histories table.

Revision ID: 0001_create_dialogue_histories
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""

from __future__ import annotations

from alembic import op

revision = "0001_create_dialogue_histories"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create pgvector extension and dialogue histories table."""
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS dialogue_histories (
            id BIGSERIAL PRIMARY KEY,
            user_input TEXT NOT NULL,
            assistant_response TEXT NOT NULL,
            model TEXT,
            input_embedding vector(1536),
            response_embedding vector(1536),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
        """,
    )


def downgrade() -> None:
    """Drop dialogue histories table and pgvector extension."""
    op.execute("DROP TABLE IF EXISTS dialogue_histories")
    op.execute("DROP EXTENSION IF EXISTS vector")
