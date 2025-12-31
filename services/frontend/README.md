# フロントエンド

React Router v7 Framework Mode + Vite + TypeScript で `POST /dialogue` を叩く最小構成です。

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
このリポジトリには本番サーバの実装が含まれていないため、以下のいずれかで用意してください。

- 公式の `@react-router/serve` を導入して `build` を配信する
- `@react-router/node` の `createRequestHandler` を使った独自サーバを実装する

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
未設定の場合は開発サーバのプロキシで `/dialogue` を `http://localhost:8000` に転送します。

例:

```
VITE_API_BASE_URL=http://localhost:8000
```
