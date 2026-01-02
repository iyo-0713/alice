"""DB操作."""

from __future__ import annotations

import logging

from psycopg import connect

from app.env import Environments

logger = logging.getLogger(__name__)
env = Environments()


def _truncate_for_log(value: str | None, limit: int = 500) -> str | None:
    if value is None:
        return None
    if len(value) <= limit:
        return value
    return f"{value[:limit]}...[truncated {len(value) - limit} chars]"


def save_dialogue_history(user_input: str, assistant_response: str, model: str| None, title: str) -> None:
    """対話履歴をDBに保存する."""
    database_url = (env.database_url or "").strip()
    if not database_url:
        return

    try:
        with connect(database_url) as conn, conn.cursor() as cur:
            cur.execute(
                """
                    INSERT INTO dialogue_histories (user_input, assistant_response, model, title)
                    VALUES (%s, %s, %s, %s)
                    """,
                (user_input, assistant_response, model, title),
            )
            conn.commit()
    except Exception:
        logger.exception(
            "Failed to store dialogue history (user_input=%r assistant_response=%r model=%r title=%r)",
            _truncate_for_log(user_input),
            _truncate_for_log(assistant_response),
            _truncate_for_log(model),
            _truncate_for_log(title),
        )
