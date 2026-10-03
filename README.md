# ペット手帳
ペットを飼う人が通院履歴、ワクチン履歴など大切なペットの体調管理ができるアプリ
## アプリ概要
## サイトイメージ
![サイト画像](https://github.com/kageyamasgouri/pet/blob/1e285c89bb6bfb8598a92a5cd19f694d7bb291e1/docs/%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88%202026-09-28%2019.07.43.png?raw=true)
## サイトURL
https://petcare-gamma-lemon.vercel.app
## 使用技術
Next.js 16：画面構築・アプリケーション基盤
React 19：UIコンポーネントと画面状態の管理
TypeScript 5.7：型安全な開発
Tailwind CSS 4：レイアウト・デザイン・レスポンシブ対応
shadcn/ui関連：UIコンポーネント設計の基盤
Lucide React：犬・猫・カレンダー・ワクチン等のアイコン
React Hooks：useState、useMemo によるログイン状態、ペット情報、記録データの管理
Vercel Analytics：本番環境でのアクセス分析
pnpm：パッケージ管理
DevTools ブラウザの開発者ツール
GitHub Actions CI/CD

## 設計ドキュメント
## 機能一覧
- ユーザー登録・ログイン機能
- ペット情報の登録・管理機能
- 通院履歴の記録・閲覧機能
- ワクチン履歴の記録・閲覧機能
## テスト、修正の設計及び実施書
https://docs.google.com/spreadsheets/d/1v1rOo1L8zo0l9FADVcRr5itnIe-dPVWXWAweLZgztoY/edit?gid=0#gid=0
## アプリ改善案
https://docs.google.com/spreadsheets/d/1xIhFaGZSKPCW3XSGmIM8_zFlAwz4cKOvFCDEzw6vtnU/edit?gid=482600378#gid=482600378
## 備考
活用した生成AIとその用途

ChatGPT：要件定義、設計、各種リサーチ
v0：アプリのモック作成
GitHub Copilot Chat：ローカル環境でのコードの修正相談
