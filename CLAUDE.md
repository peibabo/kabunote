日本語でやり取りをお願いします。
git commitをする前に修正内容をもとに必要であればREADME及びCLAUDE.mdを修正してください。
また、docs/配下のドキュメントに関する修正が行われた場合は、ドキュメントも更新してください。
git commitをする前に必ず `npm run test:run` を実行し、全テストがパスすることを確認してください。テストが失敗した場合はコミットせず、修正してください。
git commit, push, PR作成まで続けてやってください。

# Kabunote - 投資思考整理ダッシュボード

## プロジェクト概要
- **フレームワーク**: Next.js 16.1.6 + TypeScript + Tailwind CSS + Supabase + Prisma 7
- **目的**: 投資家の思考を整理する本格的なWebアプリケーション
- **認証**: Google OAuth + Magic Link（Supabase Auth / RLS / PKCE）
- **データ**: PostgreSQL（全データDB管理・ログイン必須）

## 開発コマンド
```bash
npm run dev          # localhost:3000（開発用DB自動接続）
npm run test         # テスト（ウォッチモード）
npm run test:run     # テスト（1回実行）
npm run test:unit    # P0: 純粋関数ユニットテスト
npm run test:api     # P1: APIルート統合テスト
npm run test:hooks   # P2: カスタムフックテスト
npm run test:components  # P3: コンポーネント描画テスト
npm run update:stocks    # JPXデータからstocks.csv更新
```

## 環境分離（dev/prod）
- `.env.development.local` → 開発用Supabaseプロジェクト（`npm run dev` で自動適用）
- `.env.local` → 本番用Supabaseプロジェクト（`npm run build` で適用）
- セットアップ手順は `.env.example` を参照
- 開発DB初期化: `scripts/setup-dev-db.sql` をSQL Editorで実行

## ドキュメント構成
- `docs/architecture.md` - DB設計・API仕様・フック・型定義・コンポーネント構成
- `docs/patterns.md` - 実装パターン集（resolveStockId・DBフック・APIルート・RLS等）
- `docs/changelog.md` - Phase完了履歴（マイルストーンアーカイブ）
- `docs/gamification.md` - ゲーミフィケーション仕様（レベル・XP・ストリーク・UI・技術構成）

## 主要機能
- **銘柄管理**: 検索・追加・最大20銘柄・D&D並べ替え・お気に入りグループ
- **株ノオト**: 自動保存メモ・カスタムタグ8色・全体横断AND検索
- **投資戦略**: 分析・次の一手・戦略一覧ダッシュボード
- **ポートフォリオ**: 保有管理・損益分析・サマリー・4種円グラフ・現金比率可視化・日次スナップショット・推移グラフ
- **配当・優待**: 権利確定日・シミュレーション・利回り計算・一覧ダッシュボード
- **アラート**: 6段階価格アラート・スヌーズ・統合管理・ネオン演出
- **カレンダー**: 6種イベント・タイムライン・月間カレンダー・カウントダウン
- **ゲーミフィケーション**: 投資家レベル20段階・XP経験値・ストリーク・レベルアップ演出・称号コレクション25種
- **その他**: サウンドフィードバック10種・目安箱・外部リンクカスタマイズ・投資格言

## アーキテクチャ

### ルート構成
```
/           → ランディングページ（公開、認証済みなら /dashboard にリダイレクト）
/login      → ログイン画面（Google OAuth + Magic Link）
/dashboard  → メインアプリ（認証必須、未認証なら /login にリダイレクト）
/help       → ヘルプページ（公開）
/privacy    → プライバシーポリシー（公開）
/terms      → 利用規約（公開）
```
- 認証保護は `src/proxy.ts` で実装（Next.js 16 proxy規約）

### データベーススキーマ（21テーブル）
```
app_users (ユーザー管理)
├── stocks (銘柄マスター)
│   ├── stock_memos, stock_prices, stock_positions
│   ├── stock_events, stock_dividends, stock_benefits
│   ├── stock_tags, next_action_plans, stock_tab_states
│   └── stock_favorite_groups (中間テーブル)
├── favorite_groups (お気に入りグループ)
├── snoozed_alerts (アラートスヌーズ管理)
├── feedbacks (フィードバック・目安箱)
├── user_external_links (外部リンク設定)
├── portfolio_snapshots (ポートフォリオ日次スナップショット)
│   └── stock_price_snapshots (銘柄別日次株価スナップショット)
├── chart_memos (チャートメモ: グラフデータポイントへのメモ)
├── user_gamification (ゲーミフィケーション状態)
└── xp_activity_logs (XPアクティビティログ)
```

> コンポーネント・フック・API・型定義の詳細は `docs/architecture.md` を参照
> 実装パターンは `docs/patterns.md` を参照

## 未完了タスク

### ローンチ後改善
- [ ] ユーザビリティ向上（キーボードショートカット・一括操作・並び替え）
- [ ] データエクスポート機能（CSV/JSON）

### Phase 1.1（ローンチ後すぐ）
- [ ] 使いやすさ向上（クイックタグ・決算日一括設定）
- [x] 株ノオトのテンプレート（5種プリセット：ファンダメンタル・テクニカル・配当優待・銘柄調査・売買判断）
- [ ] データ活用拡張（業種別グループ・決算統計・保有期間計算）
- [ ] ユーザー設定機能

### Phase 1.5（デイリーエンゲージメント強化）
**目標: ユーザーが毎日カブノオトにアクセスしたくなる仕組みを構築**

- [ ] 投資チェックリスト（デイリールーティン管理・連続日数カウント）
- [ ] 投資日記（1日1記録・カレンダー振り返り）
- [ ] 週次・月次レビュー自動生成
- [x] 投資家レベル・経験値（ゲーミフィケーション）
- [x] 称号コレクション（特定条件で投資テーマ称号を獲得・レベルとは別軸のモチベーション）
- [ ] プレステージ制（Lv.20カンスト者が出始めてから検討。周回システムで称号変化）
- [x] 連続ログインストリーク（ゲーミフィケーション内でストリーク機能として実装済み）
- [x] 今日の投資格言（日替わり100件・ネオン縦線カード）
- [ ] 銘柄メモのランダムリマインド
- [ ] 決算カウントダウン強化・配当カレンダー強化

### 将来的な検討（優先度低）
- [ ] デイリー投資ダイジェスト（今日のサマリー：イベント・Next Action・アラート）

### Phase 2（大型機能追加）
- [ ] 売買記録（取引記録・判断記録・パフォーマンス分析・振り返り支援）
- [ ] イベント通知機能（決算日リマインダー・権利確定日通知）

### 将来的な拡張
- [ ] 株価API連携（自動更新）
- [ ] E2Eテスト導入（Playwright等）
- [ ] アクセシビリティ強化（WCAG 2.1 AA準拠）
