# AGENTS

このリポジトリの技術スタックを前提に、エージェントが迷わず作業できるように要点をまとめます。

## ルール

- 回答は必ず日本語で行うこと
- テストを絶対に書き換えないこと
- テストクリアのためにユーザの指示に反する変更を加えないこと

## 技術スタック

- Backend: Python 3.13 / FastAPI / Uvicorn / SQLAlchemy / Alembic / psycopg / pydantic
- DB: PostgreSQL 16 + pgvector（`DATABASE_URL` 未設定時は保存スキップ）
- Frontend: React 18 / React Router v7 (Framework Mode) / Vite / TypeScript
- Testing & Lint: pytest / ruff / Vitest / Testing Library / MSW
- Tooling: uv（Python 依存管理・実行）
- Container: Docker（backend: python:3.13-slim, frontend: node:20-slim）
- Docs: RedPen（`config/redpen-conf-ja.xml`）

## 主要ディレクトリ

- `services/backend`: FastAPI アプリ、`alembic`、`tests`
- `services/frontend`: React Router アプリ、`server.js`
- `services/postgres`: PostgreSQL（pgvector）起動手順
- `config`: RedPen 設定

## よく使うコマンド

### Backend

```
cd services/backend
uv venv
uv pip install -e '.[dev]'
uv run uvicorn app.main:app --reload
```

テスト / Lint:

```
cd services/backend
uv run pytest
uv run ruff check .
```

### DB（任意）

```
docker run -d --name alice-postgres \
  -e POSTGRES_DB=alice \
  -e POSTGRES_USER=alice \
  -e POSTGRES_PASSWORD=alice \
  -p 5432:5432 \
  -v alice-db-data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16

export DATABASE_URL=postgresql://alice:alice@localhost:5432/alice

cd services/backend
uv run alembic upgrade head
```

### Frontend

```
cd services/frontend
npm install
npm run dev
```

ビルド / テスト / 型チェック:

```
cd services/frontend
npm run build
npm run test
npm run typecheck
```

SSR ビルド後の起動:

```
cd services/frontend
node server.js
```

## 環境変数

- Backend: `DATABASE_URL`（未設定なら DB 保存をスキップ）
- Frontend (dev): `VITE_API_BASE_URL`
- Frontend (SSR): `API_BASE_URL`
