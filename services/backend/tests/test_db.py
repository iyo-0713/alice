"""Test database persistence helpers."""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

if TYPE_CHECKING:
    import pytest

from app import db


def test_save_dialogue_history_skips_when_database_url_missing(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that save_dialogue_history skips when DATABASE_URL is missing."""
    monkeypatch.setattr(db.env, "database_url", "")
    connect_mock = MagicMock()
    monkeypatch.setattr(db, "connect", connect_mock)

    db.save_dialogue_history("hello", "response", "dummy", "dummy")

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

    db.save_dialogue_history("hello", "response", "dummy", "dummy")

    connect_mock.assert_called_once_with("postgresql://example")
    cursor.execute.assert_called_once()
    execute_args = cursor.execute.call_args.args
    assert "INSERT INTO dialogue_histories" in execute_args[0]
    assert execute_args[1] == ("hello", "response", "dummy", "dummy")
    connection.commit.assert_called_once()


def test_save_dialogue_history_logs_connection_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that save_dialogue_history logs when connect fails."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")
    connect_mock = MagicMock(side_effect=RuntimeError("boom"))
    monkeypatch.setattr(db, "connect", connect_mock)
    exception_mock = MagicMock()
    monkeypatch.setattr(db.logger, "exception", exception_mock)

    db.save_dialogue_history("hello", "response", "dummy", "dummy")

    connect_mock.assert_called_once_with("postgresql://example")
    exception_mock.assert_called_once_with(
        "Failed to store dialogue history (user_input=%r assistant_response=%r model=%r title=%r)",
        "hello",
        "response",
        "dummy",
        "dummy",
    )


def test_save_dialogue_history_logs_sql_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test that save_dialogue_history logs when execute fails."""
    monkeypatch.setattr(db.env, "database_url", "postgresql://example")

    cursor = MagicMock()
    cursor.execute.side_effect = RuntimeError("boom")
    cursor_context = MagicMock()
    cursor_context.__enter__.return_value = cursor
    cursor_context.__exit__.return_value = False

    connection = MagicMock()
    connection.cursor.return_value = cursor_context
    connection.__enter__.return_value = connection
    connection.__exit__.return_value = False

    connect_mock = MagicMock(return_value=connection)
    monkeypatch.setattr(db, "connect", connect_mock)
    exception_mock = MagicMock()
    monkeypatch.setattr(db.logger, "exception", exception_mock)

    db.save_dialogue_history("hello", "response", "dummy", "dummy")

    connect_mock.assert_called_once_with("postgresql://example")
    cursor.execute.assert_called_once()
    connection.commit.assert_not_called()
    exception_mock.assert_called_once_with(
        "Failed to store dialogue history (user_input=%r assistant_response=%r model=%r title=%r)",
        "hello",
        "response",
        "dummy",
        "dummy",
    )
