"""Test database persistence helpers."""

from __future__ import annotations

from unittest.mock import MagicMock

import pytest

import app.db as db


def test_save_dialogue_history_skips_when_database_url_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that save_dialogue_history skips when DATABASE_URL is missing."""
    monkeypatch.setattr(db.env, "database_url", "")
    connect_mock = MagicMock()
    monkeypatch.setattr(db, "connect", connect_mock)

    db.save_dialogue_history("hello", "response", "dummy")

    assert connect_mock.call_count == 0


def test_save_dialogue_history_executes_insert(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that save_dialogue_history executes an insert."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")

    cursor = MagicMock()
    cursor_context = MagicMock()
    cursor_context.__enter__.return_value = cursor
    cursor_context.__exit__.return_value = False

    connection = MagicMock()
    connection.cursor.return_value = cursor_context
    connection.__enter__.return_value = connection
    connection.__exit__.return_value = False

    connect_mock = MagicMock(return_value=connection)
    monkeypatch.setattr(db, "connect", connect_mock)

    db.save_dialogue_history("hello", "response", "dummy")

    connect_mock.assert_called_once_with("postgresql://example")
    cursor.execute.assert_called_once()
    execute_args = cursor.execute.call_args.args
    assert "INSERT INTO dialogue_histories" in execute_args[0]
    assert execute_args[1] == ("hello", "response", "dummy")
    connection.commit.assert_called_once()
