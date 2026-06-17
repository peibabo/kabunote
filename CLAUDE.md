日本語でやり取りをお願いします。
git commitをする前に修正内容をもとに必要であればREADME及びCLAUDE.mdを修正してください。
また、docs/配下のドキュメントに関する修正が行われた場合は、ドキュメントも更新してください。
git commitをする前に必ず `npm run test:run` を実行し、全テストがパスすることを確認してください。テストが失敗した場合はコミットせず、修正してください。
git commit, push, PR作成まで続けてやってください。
カブノオトは日本向けのサイトなのでJSTベースでお願いします。

# Kabunote - 投資思考整理ダッシュボード

## プロジェクト概要
- **フレームワーク**: Next.js 16 + TypeScript + Tailwind CSS + Supabase + Prisma 7
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
- `.env.development.local` → 開発用Supabase（`npm run dev` で自動適用）
- `.env.local` → 本番用Supabase（`npm run build` で適用）
- セットアップ手順は `.env.example` を参照
- 開発DB初期化: `scripts/setup-dev-db.sql` をSQL Editorで実行

## ドキュメント構成
- `docs/architecture.md` - DB設計（27テーブル）・API仕様・フック・型定義・コンポーネント構成
- `docs/patterns.md` - 実装パターン集（resolveStockId・DBフック・APIルート・RLS等）
- `docs/changelog.md` - Phase完了履歴（マイルストーンアーカイブ）
- `docs/gamification.md` - ゲーミフィケーション仕様（レベル・XP・ストリーク・UI・技術構成）

## 主要機能
銘柄管理（検索・D&D並べ替え・お気に入りグループ）/ 株ノオト（自動保存メモ・タグ・検索・ニュースクリップ）/ 投資戦略（PER/PBRバリュエーション・次の一手）/ ポートフォリオ（損益分析・円グラフ・日次スナップショット・推移グラフ・NISA対応・ポジション売却＝確定損益記録・年間損益サマリー）/ 配当・優待（シミュレーション・月別カレンダー・利回りランキング）/ アラート（6段階価格アラート・スヌーズ）/ カレンダー（6種イベント・決算カウントダウン）/ ゲーミフィケーション（レベル20段階・XP15種・称号31種・ストリーク）/ デイリーチェックリスト / 投資日記 / サウンドフィードバック / 投資格言

## ルート構成
```
/           → ランディングページ（公開、認証済みなら /dashboard にリダイレクト）
/blog       → SEOブログ一覧（公開、MDXベース）
/blog/[slug]→ ブログ記事詳細（公開、SSG）
/login      → ログイン画面（Google OAuth + Magic Link）
/dashboard  → メインアプリ（認証必須、未認証なら /login にリダイレクト）
/help       → ヘルプページ（公開）
/privacy    → プライバシーポリシー（公開）
/terms      → 利用規約（公開）
```
- 認証保護は `src/proxy.ts` で実装（Next.js 16 proxy規約）

## gstack
Web ブラウジングには gstack の /browse スキルを使用してください。mcp__claude-in-chrome__* ツールは使用しないでください。
利用可能なスキル: /office-hours, /plan-ceo-review, /plan-eng-review, /plan-design-review, /design-consultation, /review, /ship, /land-and-deploy, /canary, /benchmark, /browse, /qa, /qa-only, /design-review, /setup-browser-cookies, /setup-deploy, /retro, /investigate, /document-release, /codex, /cso, /autoplan, /careful, /freeze, /guard, /unfreeze, /gstack-upgrade

## 未完了タスク

### ローンチ後改善
- [ ] ユーザビリティ向上（キーボードショートカット・一括操作・並び替え）
- [ ] データエクスポート機能（CSV/JSON）

### Phase 1.1（ローンチ後すぐ）
- [ ] 使いやすさ向上（クイックタグ・決算日一括設定）
- [ ] データ活用拡張（業種別グループ・決算統計・保有期間計算）
- [ ] ユーザー設定機能

### Phase 1.5（デイリーエンゲージメント強化）
- [ ] 週次・月次レビュー自動生成
- [ ] プレステージ制（Lv.20カンスト者が出始めてから検討）
- [ ] 銘柄メモのランダムリマインド

### Phase 2（大型機能追加）
- [ ] 売買記録（取引記録・判断記録・パフォーマンス分析・振り返り支援）
- [ ] イベント通知機能（決算日リマインダー・権利確定日通知）

### 将来的な拡張
- [ ] デイリー投資ダイジェスト（今日のサマリー）
- [ ] 株価API連携（自動更新）
- [ ] E2Eテスト導入（Playwright等）
- [ ] アクセシビリティ強化（WCAG 2.1 AA準拠）
