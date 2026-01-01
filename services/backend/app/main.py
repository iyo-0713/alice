"""main.py."""

from fastapi import BackgroundTasks, FastAPI

from app.env import Environments
from app.db import save_dialogue_history
from app.response.dummy import dummy_response
from app.schemas.dialogue import DialogueRequest, DialogueResponse

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

    background_tasks.add_task(save_dialogue_history, payload.input, response, payload.model)
    return DialogueResponse(response=response)
