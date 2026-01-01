- [エンドポイント](#エンドポイント)
  - [llm](#llm)
- [環境設定](#環境設定)
  - [docker](#docker)
  - [DB (PostgreSQL + pgvector)](#db-postgresql--pgvector)
  - [uv](#uv)
  - [テスト方法](#テスト方法)


## エンドポイント

### llm

`POST /dialogue`

```
curl -X POST "http://localhost:8000/dialogue" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello"}'
```

## 環境設定

### docker

サービス単体で起動する場合は以下を実行します。

```
cd services/backend
docker build -t alice-backend .
docker run --rm -p 8000:8000 alice-backend
```

確認:

```
curl -X POST "http://localhost:8000/dialogue" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello"}'
```

### DB (PostgreSQL + pgvector)

対話履歴は PostgreSQL に保存します。`DATABASE_URL` が未設定の場合は保存をスキップします。

DB は単独コンテナで起動します。起動手順は `services/postgres/README.md` を参照してください。

```
export DATABASE_URL=postgresql://alice:alice@localhost:5432/alice
```

初期化と更新は Alembic で行います。

```
cd services/backend
uv run alembic upgrade head
```

マイグレーションの追加:

```
cd services/backend
uv run alembic revision -m "add new table"
```

### uv

uv を使って環境設定をしています。次の手順で環境を作れます。

```
cd services/backend
# uvが存在しない場合は以下の形でダウンロード
# curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv
uv pip install -e '.[dev]'
```

また新しいライブラリを利用する場合は以下の形で追加と更新を行ってください。なお本番環境の場合は `dev` 指定は不要です。
```
cd services/backend
# 開発環境
uv add *** --optional dev
uv lock
uv sync --extra dev
```

起動

```
uv run uvicorn app.main:app --reload
```


### テスト方法

テストは `pytest`、Lint は `ruff` を使います。以下は `services/backend` ディレクトリで実行します。

```
cd services/backend
uv run pytest
uv run ruff check .
```
