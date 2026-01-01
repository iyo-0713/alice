"""DB操作."""

from __future__ import annotations

import logging

from psycopg import connect

from app.env import Environments

logger = logging.getLogger(__name__)
env = Environments()


def save_dialogue_history(user_input: str, assistant_response: str, model: str | None) -> None:
    """対話履歴をDBに保存する."""
    database_url = (env.database_url or "").strip()
    if not database_url:
        return

    try:
        with connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO dialogue_histories (user_input, assistant_response, model)
                    VALUES (%s, %s, %s)
                    """,
                    (user_input, assistant_response, model),
                )
                conn.commit()
    except Exception:
        logger.exception("Failed to store dialogue history")
