"""dialogueエンドポイントのテスト."""

import sys
from http import HTTPStatus
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.env import Environments
from app.main import app

client = TestClient(app)
env = Environments()


def test_dialogue_uses_dummy_model() -> None:
    """ダミーモデルの出力をテストする."""
    response = client.post(
        "/dialogue",
        json={"input": "hello", "model": "dummy"},
    )

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"response": "dummy: こんにちは。入力はhelloです"}


@pytest.mark.skip(reason="デフォルトモデルはAPI利用の可能性があるのでスキップ")
def test_dialogue_uses_default_model(monkeypatch: pytest.MonkeyPatch) -> None:
    """デフォルトモデルの出力をテストする."""
    monkeypatch.setattr(env, "default_llm_model", "dummy")
    response = client.post("/dialogue", json={"input": "はじめまして", "model": None})

    assert response.status_code == HTTPStatus.OK
    assert response.json() == {"response": "dummy: こんにちは。入力ははじめましてです"}
