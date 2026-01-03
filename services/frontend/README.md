# フロントエンド

React Router v7 Framework Mode + Vite + TypeScript で `POST /dialogue` を叩く最小構成です。履歴一覧は `GET /dialogue/histories` で取得し、左側に表示します。

## 使い方（開発）

1. バックエンドを起動します（`http://localhost:8000`）。
2. フロントエンドを起動します。

```sh
cd services/frontend
npm install
npm run dev
```

## 本番ビルド/起動

ビルド:

```sh
cd services/frontend
npm run build
```

ビルド成果物は `build/client` と `build/server/index.js` に出力されます。
SSR を動かすにはアプリサーバと静的ファイル配信が必要です。
このリポジトリでは簡易的な Node サーバ (`server.js`) を用意しているため、ビルド後に以下で起動できます。

```sh
node server.js
```

## Docker

ビルド:

```sh
cd services/frontend
docker build -t alice-frontend .
```

起動:

```sh
docker run --rm -p 5173:5173 -e API_BASE_URL=http://host.docker.internal:8000 alice-frontend
```

ブラウザで `http://localhost:5173` を開いてください。
バックエンドが別コンテナの場合は `API_BASE_URL` をコンテナ名で指定します（例: `http://backend:8000`）。

## テスト

```sh
cd services/frontend
npm run test
```

## 型チェック

```sh
cd services/frontend
npm run typecheck
```

## 環境変数

`VITE_API_BASE_URL` を設定すると、API のベース URL を上書きできます。
未設定の場合は開発サーバのプロキシで `/dialogue` と `/dialogue/histories` を `http://localhost:8000` に転送します。
本番サーバで `/dialogue` 配下をプロキシしたい場合は `API_BASE_URL` を設定してください。

例:

```
VITE_API_BASE_URL=http://localhost:8000
```
