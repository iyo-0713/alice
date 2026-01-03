"""DB操作."""

from __future__ import annotations

import logging
from datetime import datetime

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


def fetch_dialogue_histories(limit: int = 100) -> list[tuple[int, str | None, datetime]]:
    """対話履歴の一覧を取得する."""
    database_url = (env.database_url or "").strip()
    if not database_url:
        return []
    if limit <= 0:
        return []

    try:
        with connect(database_url) as conn, conn.cursor() as cur:
            cur.execute(
                """
                    SELECT id, title, created_at
                    FROM dialogue_histories
                    ORDER BY created_at DESC, id DESC
                    LIMIT %s
                    """,
                (limit,),
            )
            rows = cur.fetchall()
            return [(row[0], row[1], row[2]) for row in rows]
    except Exception:
        logger.exception("Failed to fetch dialogue histories (limit=%r)", limit)
        return []
