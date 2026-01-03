"""Tests for dialogue history persistence helpers."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import TYPE_CHECKING
from unittest.mock import MagicMock

if TYPE_CHECKING:
    import pytest

from app import db


def test_fetch_dialogue_histories_skips_when_database_url_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure fetch skips when DATABASE_URL is missing."""
    monkeypatch.setattr(db.env, "database_url", "")
    connect_mock = MagicMock()
    monkeypatch.setattr(db, "connect", connect_mock)

    assert db.fetch_dialogue_histories() == []

    assert connect_mock.call_count == 0


def test_fetch_dialogue_histories_skips_when_limit_is_not_positive(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure fetch skips when limit is not positive."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")
    connect_mock = MagicMock()
    monkeypatch.setattr(db, "connect", connect_mock)

    assert db.fetch_dialogue_histories(limit=0) == []

    assert connect_mock.call_count == 0


def test_fetch_dialogue_histories_returns_rows(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure fetch returns rows from the database."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")
    created_at = datetime(2024, 1, 2, 3, 4, 5, tzinfo=UTC)

    cursor = MagicMock()
    cursor.fetchall.return_value = [(1, "hello", created_at)]
    cursor_context = MagicMock()
    cursor_context.__enter__.return_value = cursor
    cursor_context.__exit__.return_value = False

    connection = MagicMock()
    connection.cursor.return_value = cursor_context
    connection.__enter__.return_value = connection
    connection.__exit__.return_value = False

    connect_mock = MagicMock(return_value=connection)
    monkeypatch.setattr(db, "connect", connect_mock)

    result = db.fetch_dialogue_histories(limit=10)

    connect_mock.assert_called_once_with("postgresql://example")
    cursor.execute.assert_called_once()
    execute_args = cursor.execute.call_args.args
    assert "SELECT id, title, created_at" in execute_args[0]
    assert execute_args[1] == (10,)
    assert result == [(1, "hello", created_at)]


def test_fetch_dialogue_histories_logs_on_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure fetch logs errors and returns empty list."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")
    connect_mock = MagicMock(side_effect=RuntimeError("boom"))
    monkeypatch.setattr(db, "connect", connect_mock)
    exception_mock = MagicMock()
    monkeypatch.setattr(db.logger, "exception", exception_mock)

    assert db.fetch_dialogue_histories(limit=5) == []

    connect_mock.assert_called_once_with("postgresql://example")
    exception_mock.assert_called_once_with(
        "Failed to fetch dialogue histories (limit=%r)",
        5,
    )
