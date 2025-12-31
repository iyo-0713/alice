# フロントエンド

React Router v7 Framework Mode + Vite + TypeScript で `POST /dialogue` を叩く最小構成です。

## 使い方

1. バックエンドを起動します（`http://localhost:8000`）。
2. フロントエンドを起動します。

```
cd services/frontend
npm install
npm run dev
```

## 環境変数

`VITE_API_BASE_URL` を設定すると、API のベース URL を上書きできます。
未設定の場合は開発サーバのプロキシで `/dialogue` を `http://localhost:8000` に転送します。

例:

```
VITE_API_BASE_URL=http://localhost:8000
```
