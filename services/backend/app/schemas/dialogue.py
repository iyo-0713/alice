"""llmに関するスキーマ定義."""

from datetime import datetime

from pydantic import BaseModel


class DialogueRequest(BaseModel):
    input: str
    model: str | None = None


class DialogueResponse(BaseModel):
    response: str


class DialogueHistoryItem(BaseModel):
    id: int
    title: str | None
    created_at: datetime


class DialogueHistoriesResponse(BaseModel):
    histories: list[DialogueHistoryItem]
