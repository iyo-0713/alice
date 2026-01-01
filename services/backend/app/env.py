"""環境変数."""

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

load_dotenv()


class Environments(BaseSettings):
    # ログレベル
    log_level: str = Field(default="INFO")

    # 利用モデル
    default_llm_model: str = Field(default="dummy")

    # DB接続URL
    database_url: str | None = Field(default=None)
