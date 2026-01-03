"""dialogueエンドポイントのテスト."""

from http import HTTPStatus

import pytest
from fastapi.testclient import TestClient

import app.main as main_module
from app.env import Environments
from app.main import app


def test_dialogue_uses_dummy_model() -> None:
    """ダミーモデルの出力をテストする."""
    client = TestClient(app)

    response = client.post(
        "/dialogue",
        json={"input": "hello", "model": "dummy"},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"response": "dummy: こんにちは。入力はhelloです"}


def test_dialogue_records_history(monkeypatch: pytest.MonkeyPatch) -> None:
    """対話履歴が保存されることを確認する."""
    client = TestClient(app)
    calls: list[tuple[str, str, str | None, str]] = []

    def fake_save(user_input: str, assistant_response: str, model: str | None, title: str) -> None:
        calls.append((user_input, assistant_response, model, title))

    monkeypatch.setattr(main_module, "save_dialogue_history", fake_save)
    response = client.post(
        "/dialogue",
        json={"input": "hello", "model": "dummy"},
    )

    assert response.status_code == HTTPStatus.OK
    assert calls == [("hello", "dummy: こんにちは。入力はhelloです", "dummy", "dummy")]


@pytest.mark.skip(reason="デフォルトモデルはAPI利用の可能性があるのでスキップ")
def test_dialogue_uses_default_model(monkeypatch: pytest.MonkeyPatch) -> None:
    """デフォルトモデルの出力をテストする."""
    client = TestClient(app)
    env = Environments()

    monkeypatch.setattr(env, "default_llm_model", "dummy", "dummy")
    response = client.post("/dialogue", json={"input": "はじめまして", "model": None})

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"response": "dummy: こんにちは。入力ははじめましてです"}
