# PostgreSQL (pgvector)

このディレクトリは DB を単独コンテナで起動するための手順をまとめたものです。
スキーマ初期化と更新は Alembic で行います。

## 起動

```
docker run -d --name alice-postgres \
  -e POSTGRES_DB=alice \
  -e POSTGRES_USER=alice \
  -e POSTGRES_PASSWORD=alice \
  -p 5432:5432 \
  -v alice-db-data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16
```

## 停止

```
docker stop alice-postgres
docker rm alice-postgres
```

## 接続例

```
export DATABASE_URL=postgresql://alice:alice@localhost:5432/alice
```

## 対話履歴の保存確認

対話を実行し、DBに履歴が保存されたか確認する手順です。

1. Postgres を起動する

```
docker run -d --name alice-postgres \
  -e POSTGRES_DB=alice \
  -e POSTGRES_USER=alice \
  -e POSTGRES_PASSWORD=alice \
  -p 5432:5432 \
  -v alice-db-data:/var/lib/postgresql/data \
  pgvector/pgvector:pg16
```

2. 環境変数を設定する

```
export DATABASE_URL=postgresql://alice:alice@localhost:5432/alice
```

3. Alembic で初期化する

```
cd services/backend
uv run alembic upgrade head
```

4. バックエンドを起動する

```
cd services/backend
uv run uvicorn app.main:app --reload
```

5. 対話リクエストを送る

```
curl -X POST "http://localhost:8000/dialogue" \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello", "model":"dummy"}'
```

6. DBに保存されたか確認する

```
docker exec -it alice-postgres psql -U alice -d alice \
  -c "SELECT id, user_input, assistant_response, model, created_at FROM dialogue_histories ORDER BY id DESC LIMIT 5;"
```

保存はバックグラウンド処理なので、反映が遅い場合は数秒待って再実行してください。
