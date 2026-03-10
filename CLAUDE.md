日本語でやり取りをお願いします。
git commitをする前に修正内容をもとに必要であればREADME及びCLAUDE.mdを修正してください。
また、docs/配下のドキュメントに関する修正が行われた場合は、ドキュメントも更新してください。
git commitをする前に必ず `npm run test:run` を実行し、全テストがパスすることを確認してください。テストが失敗した場合はコミットせず、修正してください。

# Kabunote - 投資思考整理ダッシュボード

## プロジェクト概要
- **フレームワーク**: Next.js 16.1.6 + TypeScript + Tailwind CSS + Supabase + Prisma 7
- **目的**: 投資家の思考を整理する本格的なWebアプリケーション
- **機能**: 株式銘柄の管理・メモ・検索・分析・アカウント管理・データベース統合
- **認証**: Google OAuth + Magic Link（Supabase Auth / RLS / PKCE）
- **データ**: PostgreSQL（全データDB管理・ログイン必須）

## 開発コマンド
```bash
npm run dev          # localhost:3000
npm run test         # テスト（ウォッチモード）
npm run test:run     # テスト（1回実行）
npm run test:unit    # P0: 純粋関数ユニットテスト
npm run test:api     # P1: APIルート統合テスト
npm run test:hooks   # P2: カスタムフックテスト
npm run test:components  # P3: コンポーネント描画テスト
npm run update:stocks    # JPXデータからstocks.csv更新
```

## ドキュメント構成
- `docs/architecture.md` - DB設計・API仕様・フック・型定義・コンポーネント構成
- `docs/patterns.md` - 実装パターン集（resolveStockId・DBフック・APIルート・RLS等）
- `docs/changelog.md` - Phase完了履歴（マイルストーンアーカイブ）

## 主要機能

1. **銘柄管理** - 会社名検索（日英ローマ字対応）・フローティング追加・最大20銘柄・D&D並べ替え
2. **株ノオト・タグ管理** - 自動保存・モーダル編集・カスタムタグ8色・お気に入りグループ
3. **全体検索** - 銘柄コード・会社名・業種・メモ・タグ横断AND検索
4. **タブ式情報管理** - 基本/投資戦略（分析・次の一手）/管理（保有・イベント・配当・優待）+ 統合アラート
5. **配当管理** - 権利確定日・シミュレーション・利回り・税引後計算・配当優待一覧ダッシュボード
6. **株主優待管理** - 権利確定日・必要株数・優待内容・取得資格判定
7. **ポートフォリオ分析** - サマリー・損益目標・ネオンライト可視化・4種円グラフ
8. **統合価格アラート** - 6段階アラート・複数同時表示・スマートナビゲーション・ネオン演出
9. **投資余力現金管理** - 総資産・現金比率可視化・Next Actionメモ
10. **戦略一覧ダッシュボード** - 全銘柄戦略統合表示・ソート・統計
11. **保有ポジション一覧** - 損益分析・ポートフォリオ構成・多軸ソート
12. **アラート一覧・スヌーズ** - 統合管理・6段階スヌーズ・リアルタイム更新
13. **投資カレンダー・タイムライン** - 6種イベント・タイムライン・月間カレンダー・カウントダウン

## アーキテクチャ

### データベーススキーマ（14テーブル）
```
app_users (ユーザー管理)
├── stocks (銘柄マスター)
│   ├── stock_memos, stock_prices, stock_positions
│   ├── stock_events, stock_dividends, stock_benefits
│   ├── stock_tags, next_action_plans, stock_tab_states
│   └── stock_favorite_groups (中間テーブル)
├── favorite_groups (お気に入りグループ)
└── snoozed_alerts (アラートスヌーズ管理)
```

> 詳細は `docs/architecture.md` を参照

### 主要コンポーネント
- `StockCard.tsx`: 銘柄カードメイン（タブ制御・統合アラート・スマートナビゲーション）
- `InvestmentStrategyTab.tsx` / `AnalysisSubTab.tsx` / `NextActionSubTab.tsx`: 投資戦略系
- `ManagementTab.tsx` / `PositionsManagement.tsx` / `EventManagement.tsx` / `DividendManagement.tsx` / `ShareholderBenefitManagement.tsx`: 管理系
- `SimplePortfolioSummary.tsx` / `InvestmentPieChart.tsx`: ポートフォリオ系
- `StrategySummaryPage.tsx` / `AlertSummaryPage.tsx` / `DividendBenefitListPage.tsx`: ダッシュボード系
- `InvestmentCalendar.tsx` / `InvestmentTimeline.tsx` / `TodayTomorrowEvents.tsx`: カレンダー系
- `SoundSettings.tsx`: サウンドフィードバック設定（ON/OFF・音量・プレビュー）

> フック・API・型定義の詳細は `docs/architecture.md` を参照
> 実装パターンは `docs/patterns.md` を参照

## ローンチ準備チェックリスト

### 必須改善項目
- [x] モバイル・レスポンシブ対応確認（2026年3月完了）
- [x] 初回ユーザー向けオンボーディング（5ステップウェルカムウィザード）
- [x] エラーハンドリングの強化
- [x] テストコード（Vitest + RTL + MSW、361テスト）
- [x] 20銘柄制限
- [x] favicon設定
- [ ] ドメイン設定
- [ ] SEO対策
- [ ] ユーザー問い合わせ機能

### 推奨改善項目
- [x] パフォーマンス最適化（20銘柄上限・カレンダー・検索）
- [ ] ユーザビリティ向上（キーボードショートカット・一括操作・並び替え）

### 最優先項目
1. ~~初回ユーザーガイド~~ 完了
2. ~~エラーハンドリング改善~~ 完了（グローバルエラーバウンダリ・APIエラー一元化・トースト通知・404ページ）
3. ~~簡単なヘルプページ~~ 完了（`/help`）
4. ~~UX（気持ち良い音）~~ 完了（Web Audio API シンセ音17種、ON/OFF・音量設定）
5. ~~その他（ログアウトしたらログイン画面に遷移させる）~~ 完了
   - **TODO**: プライバシーポリシーの `[運営者名]` `[メールアドレス]` プレースホルダーを実際の情報に置き換える

## 今後の開発計画

### Phase 1.1（ローンチ後すぐ）
- [ ] 使いやすさ向上（問合せ機能・テンプレート・クイックタグ・決算日一括設定）
- [ ] データ活用拡張（業種別グループ・決算統計・保有期間計算）
- [x] ユーザー設定機能（サウンドON/OFF・音量設定 完了）
- [ ] ゲーミフィケーション

### Phase 2（大型機能追加）
- [ ] 売買記録・投資日記（取引記録・判断記録・パフォーマンス分析・振り返り支援）
- [ ] イベント通知機能（決算日リマインダー・権利確定日通知）

### 将来的な拡張
- [ ] 株価API連携（自動更新）
- [ ] 高度なパフォーマンス追跡（リアルタイム株価ベース）

### テスト・品質改善
- [ ] `next build` によるビルドチェック（ユニットテストで検知できないランタイムエラーの防止）
- [ ] E2Eテスト導入（Playwright等）
