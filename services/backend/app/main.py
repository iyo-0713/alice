"""main.py."""

from fastapi import BackgroundTasks, FastAPI

from app.db import fetch_dialogue_histories, save_dialogue_history
from app.env import Environments
from app.response.dummy import dummy_response
from app.schemas.dialogue import DialogueHistoriesResponse, DialogueHistoryItem, DialogueRequest, DialogueResponse

env = Environments()

app = FastAPI()


@app.post("/dialogue")
async def dialogue(payload: DialogueRequest, background_tasks: BackgroundTasks) -> DialogueResponse:
    """ユーザと対話するためのエンドポイント."""
    if payload.model is None:
        payload.model = env.default_llm_model

    if payload.model == "dummy": # noqa: SIM108
        response = dummy_response(payload.input, payload.model)
    else:
        response = "存在しないモデルが指定されています."

    # ダミーでタイトルを追加
    title = "dummy"

    background_tasks.add_task(save_dialogue_history, payload.input, response, payload.model, title)
    return DialogueResponse(response=response)


@app.get("/dialogue/histories")
async def dialogue_histories(limit: int = 100) -> DialogueHistoriesResponse:
    """対話履歴の一覧を取得する."""
    histories = fetch_dialogue_histories(limit)
    items = [
        DialogueHistoryItem(id=history_id, title=title, created_at=created_at)
        for history_id, title, created_at in histories
    ]
    return DialogueHistoriesResponse(histories=items)
