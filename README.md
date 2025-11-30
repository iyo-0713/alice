## リポジトリの運用方法

- main
  - 実運用・リリース済みコードだけを置く「本番ブランチ」。
  - ここに入るものは「デプロイ可能」な状態に限定する（Gitflow でいう main/master と同等）。
- develop
  - 次のリリースに向けた開発をまとめる「統合ブランチ」。 
  - feature/* や通常の fix/* をここにマージしていき、ある程度まとまったところで main へリリースする。
- feature/xxx
  - 新機能・改善ごとの短命ブランチ。
  - develop から分岐して、作業完了後に develop へマージし、ブランチは削除する。
- fix/xxx
  - バグ修正用ブランチ。
  - 通常のバグ修正：develop から fix/xxx を切って、修正後 develop にマージ。
  - 本番でクリティカルな障害が出た場合：main から fix/xxx を切って main にマージし、その後 main を develop にマージして修正を取り込む（Gitflow の hotfix に相当）。