# カブノオト - 投資思考整理ダッシュボード

![Kabunote Logo](public/kabunote-logo.png)

> 投資家の思考を整理する、直感的で美しいダッシュボード

## 概要

**カブノオト**は、投資家のための思考整理に特化したWebアプリケーションです。日本株投資において、銘柄の分析・メモ・ポジション管理を一元化し、より良い投資判断をサポートします。

### 主な特徴

- **銘柄管理** - 会社名・銘柄コード検索、ドラッグ&ドロップ並べ替え（最大20銘柄）
- **株ノオト** - 銘柄別の詳細メモ、モーダル編集、自動保存
- **カスタムタグ** - 8色対応、プリセットタグ、お気に入りグループ
- **ポジション管理** - 複数建玉の詳細追跡、平均取得価額自動計算、売却＝確定損益記録（加重平均原価）・年間損益サマリー
- **投資規律設定** - 利確目標・損切りライン管理、ネオンライト可視化
- **6段階統合アラート** - 資金不足・損切り・利確接近を自動検知、スヌーズ対応
- **配当・株主優待管理** - 配当シミュレーション、優待取得資格判定、一覧ダッシュボード
- **投資カレンダー** - 決算・権利確定日・株主総会をタイムライン表示
- **ポートフォリオ分析** - 投資額・業種・タグ・配当の円グラフ分析、日次スナップショット、推移グラフ
- **戦略一覧** - 全銘柄のNext Action Planを横断比較
- **ゲーミフィケーション** - 投資家レベル20段階、XP経験値、連続ストリーク、称号コレクション31種
- **サウンドフィードバック** - Web Audio APIシンセ音10種、操作フィードバック
- **今日の投資格言** - 日替わり100件、ネオン縦線カード表示

## クイックスタート

### 必要環境

- Node.js 18.0+
- npm

### インストール

```bash
git clone https://github.com/peibabo/kabunote.git
cd kabunote
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開く

## 技術スタック

### フロントエンド
- **Next.js 16.1.6** + TypeScript（App Router）
- **Tailwind CSS**
- **@dnd-kit**（ドラッグ&ドロップ）

### バックエンド・データベース
- **Supabase**（PostgreSQL + 認証 + RLS）
- **Prisma 7**（ORM）

### 認証
- **Google OAuth**（メイン）
- **Magic Link**（メール認証）
- **Row Level Security**（データ保護）

## プロジェクト構造

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # レイアウト・フォント設定
│   ├── page.tsx                 # メインページ
│   ├── login/                   # ログインページ
│   ├── auth/callback/           # OAuth コールバック
│   └── api/                     # APIルート
│       ├── auth/sync-user/      # ユーザー同期
│       ├── cash/                # 投資余力現金
│       ├── stocks/              # 銘柄CRUD・一覧
│       │   ├── list/            # 全銘柄一覧（関連データ込み）
│       │   ├── reorder/         # 並び替え
│       │   └── [stockId]/       # 個別銘柄
│       │       ├── memo/        # 株ノオト
│       │       ├── price/       # 株価情報
│       │       ├── position/    # ポジション
│       │       ├── event/       # イベント
│       │       ├── dividend/    # 配当
│       │       ├── benefit/     # 株主優待
│       │       ├── tag/         # タグ
│       │       └── next-action-plan/  # 次の一手
│       ├── favorite-groups/     # お気に入りグループ
│       ├── feedback/            # フィードバック（目安箱）
│       ├── gamification/        # ゲーミフィケーション（レベル・XP・称号）
│       ├── portfolio/           # ポートフォリオスナップショット・履歴
│       ├── chart-memo/          # チャートメモ
│       └── tags/                # 全タグ一覧
├── components/                  # Reactコンポーネント（13サブディレクトリ）
├── hooks/                       # カスタムフック（10サブディレクトリ）
├── types/                       # TypeScript型定義
├── lib/                         # ユーティリティ（Supabase・Prisma・認証等）
├── utils/                       # ヘルパー関数
└── data/                        # CSV解析・銘柄検索ロジック
```

## 開発

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm start        # プロダクション起動
npm run lint     # リント実行
```

## コントリビューション

プルリクエストや Issue の報告を歓迎します！

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/new-feature`)
3. 変更をコミット (`git commit -m 'Add some feature'`)
4. ブランチをプッシュ (`git push origin feature/new-feature`)
5. プルリクエストを作成

## ライセンス

このプロジェクトは MIT License の下で公開されています。

---

**より良い投資判断のために - カブノオト**
