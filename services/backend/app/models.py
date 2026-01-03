"""SQLAlchemy models for Alembic autogenerate."""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Text, text
from sqlalchemy.dialects.postgresql.base import ischema_names
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import UserDefinedType


class Base(DeclarativeBase):
    pass


class Vector(UserDefinedType):
    cache_ok = True

    def __init__(self, dimensions: int | str | None = None) -> None:
        """Vectorクラスの初期化."""
        if isinstance(dimensions, str):
            dimensions = int(dimensions)
        self.dimensions = dimensions

    def get_col_spec(self, **_kw: object) -> str:
        if self.dimensions is None:
            return "vector"
        return f"vector({self.dimensions})"

    def __repr__(self) -> str:
        """Vectorクラスの文字列表現."""
        return f"Vector({self.dimensions})"


ischema_names["vector"] = Vector


class DialogueHistory(Base):
    __tablename__ = "dialogue_histories"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    user_input: Mapped[str] = mapped_column(Text, nullable=False)
    assistant_response: Mapped[str] = mapped_column(Text, nullable=False)
    model: Mapped[str | None] = mapped_column(Text)
    title: Mapped[str | None] = mapped_column(Text)
    input_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))
    response_embedding: Mapped[list[float] | None] = mapped_column(Vector(1536))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"), nullable=False)
