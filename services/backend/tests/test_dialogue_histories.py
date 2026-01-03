"""Tests for dialogue histories endpoint."""

from __future__ import annotations

from datetime import datetime, timezone
from http import HTTPStatus
from typing import TYPE_CHECKING

from fastapi.testclient import TestClient

if TYPE_CHECKING:
    import pytest

import app.main as main_module
from app.main import app


def test_dialogue_histories_returns_items(monkeypatch: pytest.MonkeyPatch) -> None:
    """Ensure GET /dialogue/histories returns serialized items."""
    client = TestClient(app)
    created_at = datetime(2024, 1, 2, 3, 4, 5, tzinfo=timezone.utc)
    seen: dict[str, int] = {}

    def fake_fetch(limit: int):
        seen["limit"] = limit
        return [(1, "hello", created_at), (2, None, created_at)]

    monkeypatch.setattr(main_module, "fetch_dialogue_histories", fake_fetch)

    response = client.get("/dialogue/histories?limit=20")

    assert response.status_code == HTTPStatus.OK
    assert seen["limit"] == 20
    expected_timestamp = created_at.isoformat().replace("+00:00", "Z")
    assert response.json() == {
        "histories": [
            {"id": 1, "title": "hello", "created_at": expected_timestamp},
            {"id": 2, "title": None, "created_at": expected_timestamp},
        ]
    }
