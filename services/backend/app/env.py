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

    # アプリケーションが利用するデータベース接続URL
    # 例: postgresql+psycopg://user:password@localhost:5432/db_name
    # None の場合はデータベースを利用しない構成を想定。
    database_url: str | None = Field(default=None)
