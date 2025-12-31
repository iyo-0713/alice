"""llmに関するスキーマ定義."""

from pydantic import BaseModel


class DialogueRequest(BaseModel):
    input: str
    model: str | None = None


class DialogueResponse(BaseModel):
    response: str
