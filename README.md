# 目次
- [目次](#目次)
- [本編](#本編)
  - [実行環境について](#実行環境について)
  - [リポジトリの運用方法](#リポジトリの運用方法)
  - [RedPen](#redpen)
    - [Java のインストール](#java-のインストール)
    - [配布物の取得と展開](#配布物の取得と展開)
    - [PATH の追加](#path-の追加)
    - [確認](#確認)
    - [チェック](#チェック)


# 本編

## 実行環境について

```
# OS情報
NAME="Ubuntu"
VERSION="24.04.2 LTS (Noble Numbat)"
```

## リポジトリの運用方法

- main
  - 実運用・リリース済みコードだけを置く「本番ブランチ」。
  - ここに入るものは「デプロイ可能」な状態に限定する。
- develop
  - 次のリリースに向けた開発をまとめる「統合ブランチ」。 
  - feature/* や fix/* をここにマージし、あるタイミングで main へリリースする。
- feature/xxx
  - 新機能・改善ごとの短命ブランチ。
  - develop から分岐して、作業完了後に develop へマージする。
- fix/xxx
  - バグ修正用ブランチ。
  - develop から fix/xxx を切って、修正後 develop にマージ。


## RedPen

RedPen を用いて文書の構成を行う。セッティング方法は以下の通り。

### Java のインストール
```bash
sudo apt update
sudo apt install -y openjdk-11-jre
```

### 配布物の取得と展開
```bash
wget https://github.com/redpen-cc/redpen/releases/download/redpen-1.10.4/redpen-1.10.4.tar.gz
tar xvf redpen-1.10.4.tar.gz
```

### PATH の追加

（注意）各自の環境に合わせたパスを設定すること

```bash
echo 'export PATH="$PATH:$HOME/dev/alice/redpen-distribution-1.10.4/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 確認
```bash
redpen -v
```
### チェック

単体ファイルのチェック
```bash
redpen -c config/redpen-conf-ja.xml README.md
```

リポジトリに存在する全ての md ファイルに対するチェック
```bash
find ./ -name '*.md' -print0 \
  | xargs -0 redpen -c config/redpen-conf-ja.xml -f markdown -l 0
```
