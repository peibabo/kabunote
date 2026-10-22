# Kabunote - プロジェクトマイルストーン

## 価格入力の呼値ステッパー（2026年10月22日）
**損切ライン・現在の株価・利確目標の入力を、銘柄の呼値単位で −/＋ できるように改善**

### 実施内容
- `src/lib/tickSize.ts`: JPX呼値テーブル（TOPIX500構成銘柄／それ以外）による刻み幅計算。バンド境界（例: 3,000円→3,005円）や刻み外の値の補正にも対応
- `stocks.csv` に `topix500` 列を追加（JPX規模コード 1/2/4 = Core30/Large70/Mid400）。`isTopix500Sync()` で判定
- `PriceStepperInput`: −/＋ ボタン（スマホでも表示）・矢印キーで呼値単位に増減、現在の呼値を表示。未入力の損切/利確は現在株価を起点にする

---

## SEO・集客基盤の強化（2026年3月21日）
**JSON-LD構造化データ、メタデータ最適化、SNS共有ボタンを追加し、検索エンジンとSNSからの集客基盤を整備**

### 実施内容
- JSON-LD構造化データ: Organization（全ページ）、WebApplication + FAQPage（ランディング）
- メタデータ最適化: titleテンプレート（`%s | カブノオト`）、canonical URL、各ページdescription
- SNS共有ボタン: レベルアップ・称号獲得時にX/LINEシェアボタン表示
- フッターにX(Twitter)アカウントリンク追加
- 集客戦略ドキュメント `docs/user-acquisition-strategy.md` 作成

### 技術的成果
- 新規ファイル3つ: `lib/share.ts`, `components/common/ShareButtons.tsx`, `docs/user-acquisition-strategy.md`
- 修正ファイル6つ: `layout.tsx`, `page.tsx`, `help/page.tsx`, `privacy/page.tsx`, `terms/page.tsx`, `LevelUpCelebration.tsx`, `TitleUnlockedToast.tsx`, `LandingFooter.tsx`
- CSP変更なし（`window.open`ベースのインテントリンク使用）
- 全769テストパス

---

## リファクタリング Phase 4: 巨大フックの分割（2026年3月21日）
**3つの巨大フックを分割し、計算ロジックを純粋関数として抽出**

### 実施内容
- `useStockData`（297行）: `StockData` 型を `src/types/stock.ts` に移動、`addStock` ロジックを `useStockCrud` に抽出
- `useDividendBenefitList`（294行）: 計算ロジックを `src/lib/dividendBenefitCalc.ts` に純粋関数として抽出
- `usePortfolioSummary`（266行）: サマリー計算ロジックを `src/lib/portfolioSummaryCalc.ts` に純粋関数として抽出

### 技術的成果
- 新規ファイル5つ: `types/stock.ts`, `hooks/stock/useStockCrud.ts`, `lib/dividendBenefitCalc.ts`, `lib/portfolioSummaryCalc.ts`
- 新規テスト2ファイル: `dividendBenefitCalc.test.ts`（29テスト）, `portfolioSummaryCalc.test.ts`（11テスト）
- 全既存importの後方互換を再エクスポートで維持
- 全719テストパス

---

## 決算カウントダウン強化・配当カレンダー強化（2026年3月18日）
**5つの新ウィジェットでダッシュボードの投資スケジュール・配当情報を大幅強化**

### 機能概要
- 決算カウントダウンウィジェット: 直近30日以内の決算銘柄を緊急度別ネオン演出で表示
- 銘柄カード決算バッジ: 14日以内の決算銘柄にヘッダーバッジ（7日以内はpulseアニメーション）
- 月別配当カレンダー: 12ヶ月のCSS棒グラフで配当受取フローを可視化（税引後金額・月別内訳展開）
- 権利確定日カウントダウン一覧: 配当・優待の権利確定日を時系列表示（権利付き最終日も併記）
- 配当利回りランキング: 保有銘柄の利回り降順リスト（メダルアイコン・平均利回り表示）

### 技術的成果
- 新規コンポーネント6ファイル（EarningsCountdown, EarningsBadge, MonthlyDividendChart, RightsDateCountdown, DividendYieldRanking, useMonthlyDividendData）
- 既存のdividendCalc・investmentCalendarCalc・rightsDate計算ロジックを最大限再利用
- useDividendBenefitDataのデータ取得を常時有効化（ウィジェット常時表示対応）
- 全ウィジェットがデータなし時に自動非表示

---

## 称号コレクション機能（2026年3月18日）
**全25称号・6カテゴリ・4段階レアリティの称号コレクションシステム**

### 機能概要
- 6カテゴリ: 銘柄・記録・資産・戦略・継続・貢献
- 4段階レアリティ: common(8個)・rare(9個)・epic(6個)・legendary(2個)
- 称号獲得条件をオンザフライ計算（専用DBテーブル不要）
- 称号獲得時のトースト通知

### 技術的成果
- `/api/gamification/titles` APIエンドポイント
- `useTitles` フック + `TitleCollection` コンポーネント
- `src/types/titles.ts` 称号定義・条件・判定ロジック

---

## ゲーミフィケーション（投資家レベル・経験値）システム（2026年3月17日）
**投資家レベル20段階・XP経験値・連続ストリーク・レベルアップ演出**

### 機能概要
- 投資家レベル: 20段階（各レベルに称号名付き）
- XP経験値: 12種アクション（ログイン・銘柄追加・メモ保存等）、日次100XP上限
- 連続ストリーク: アクティブ日数カウント、ボーナスXP付与（7日+20%、30日+50%）
- レベルアップ演出: フルスクリーン金色グラデーション＋星アニメーション

### 技術的成果
- DBテーブル2個: `user_gamification`, `xp_activity_logs`
- APIエンドポイント3個: `/api/gamification`（GET/POST）, `/api/gamification/titles`
- `useGamification` フック: XP付与・レベル計算・ストリーク管理
- 10個の既存フックにXP付与を統合
- LevelBadge UIコンポーネント + スライドメニュー内レベル詳細セクション

---

## リファクタリング Phase 3-6: コンポーネント分割・ディレクトリ整理（2026年3月17日）
**大規模コンポーネントの分割完了とディレクトリ構造の再編成**

### 技術的成果
- **Phase 3**: StockCard.tsx 534行→316行（41%削減）、`useStockCardData` ファサードフック抽出
- **Phase 4**: 中規模5コンポーネント（DividendBenefitList, InvestmentTimeline, AlertSummary, InvestmentPieChart, EventCalendar）のデータ処理をフックに抽出
- **Phase 5**: components/ 61ファイルを13サブディレクトリに整理、hooks/ 44ファイルを10サブディレクトリに整理
- **Phase 6**: feedbackCategories一元化、TOAST_DURATIONS定数化
- 全体成果: 4,546行→2,186行（52%削減）

---

## チャートメモ・ミニチャート機能（2026年3月16日）
**ポートフォリオ推移グラフ＆銘柄カードにチャートメモとミニ株価チャートを追加**

### 機能概要
- ポートフォリオ推移グラフのデータポイントにメモを付与
- 銘柄カード分析タブにミニ株価チャート（損切/利確ライン表示）
- ミニチャート上のチャートメモ表示

### 技術的成果
- `chart_memos` テーブル追加
- `/api/chart-memo` APIルート
- `useChartMemo` フック

---

## ポートフォリオ日次スナップショット＆推移グラフ機能（2026年3月16日）
**手動確定ボタンで日次のポートフォリオ状態を記録し、時系列グラフで推移を可視化**

### 機能概要
- 「今日の記録を確定」ボタンで1日1回ポートフォリオスナップショットを保存（同日2回目は上書き）
- 記録内容: 各銘柄の株価・保有株数・評価額 + 総投資額・総評価額・損益・現金・純資産
- 4種類のグラフ: 評価額推移（面グラフ）・純資産推移（面グラフ）・損益推移（折れ線）・個別株価推移（折れ線）
- 期間切替: 1W / 1M / 3M / 6M / 1Y / 2Y

### 技術的成果
- DBテーブル2個追加: `portfolio_snapshots`, `stock_price_snapshots`
- Rechartsライブラリ導入（React 19対応）
- テスト: 68→70ファイル、517→532テスト（+15テスト）

### 新規ファイル
- `src/types/portfolio.ts` - ポートフォリオスナップショット型定義
- `src/lib/snapshotCalc.ts` - スナップショット計算ロジック
- `src/app/api/portfolio/snapshot/route.ts` - POST: スナップショット作成API
- `src/app/api/portfolio/history/route.ts` - GET: 履歴取得API
- `src/hooks/usePortfolioHistory.ts` - ポートフォリオ履歴フック
- `src/components/PortfolioHistory.tsx` - ポートフォリオ推移コンテナ
- `src/components/PortfolioChart.tsx` - Rechartsグラフ描画

---

## リファクタリング Phase 2: ロジック分離・重複パターン共通化（2026年3月14日）
**型ファイルからロジック完全分離、重複パターンのカスタムフック化、日付フォーマット統一、re-export完全削除**

### 技術的成果
- 残り3型ファイル（investmentCalendar/snooze/nextActionPlan）からロジックを `lib/*Calc.ts` に分離
- Phase 0-1で作成した6型ファイルすべてのre-exportを削除し、全importを直接参照に統一
- アコーディオン開閉パターンを `useAccordionState` フックに共通化（playSound統合・localStorage対応）
- ツールチップ表示/非表示パターンを `useTooltipState` フックに共通化
- 日付フォーマット関数を `dateFormat.ts` に統一（重複していた `formatDate` を `formatMonthDay` に集約）
- テスト: 62→68ファイル、456→517テスト（+61テスト）

### 新規ファイル
- `src/lib/investmentCalendarCalc.ts` - 営業日計算・権利付最終日・日付フォーマット
- `src/lib/snoozeCalc.ts` - スヌーズ期間定数・ラベル・残り時間計算
- `src/lib/nextActionPlanCalc.ts` - Next Action Plan分析・判定関数
- `src/lib/dateFormat.ts` - 日付フォーマット共通関数
- `src/hooks/useAccordionState.ts` - アコーディオン状態管理フック
- `src/hooks/useTooltipState.ts` - ツールチップ状態管理フック
- テストファイル6個

### 変更ファイル（30+ファイル）
- 全型ファイル（6個）からre-export削除
- 全コンポーネント・フック・ユーティリティのimportを直接参照に変更
- `PortfolioSummary.tsx` - useAccordionState適用（3箇所）
- `InvestmentTimeline.tsx` - useAccordionState + useTooltipState適用
- `DividendBenefitListPage.tsx` / `EventCalendarPage.tsx` - formatMonthDay適用

---

## 目安箱（フィードバック）機能（2026年3月11日）
**ユーザーが気軽に機能要望・改善提案をDB送信できる「目安箱」機能**

### 技術的成果
- Feedbackモデル + FeedbackCategory enum をPrismaスキーマに追加（15テーブル）
- POST /api/feedback APIルート（withAuth認証・バリデーション）
- FeedbackModalコンポーネント（4カテゴリ選択・1000文字制限・残文字数表示）
- useModalsフックにfeedback状態を統合
- SlideOutMenuに「目安箱」メニュー項目追加

### 新規ファイル
- `src/app/api/feedback/route.ts` - フィードバックAPI
- `src/components/FeedbackModal.tsx` - 送信モーダル
- `src/__tests__/api/feedback.test.ts` - APIテスト（7件）
- `src/__tests__/components/FeedbackModal.test.tsx` - コンポーネントテスト（10件）

### 変更ファイル
- `prisma/schema.prisma` - Feedbackモデル・FeedbackCategory enum・Userリレーション追加
- `src/hooks/useModals.ts` - isFeedbackOpen状態追加
- `src/components/SlideOutMenu.tsx` - 目安箱ボタン追加
- `src/app/dashboard/page.tsx` - FeedbackModalインポート・配置
- `src/__tests__/mocks/prisma.ts` - feedbackモック追加

---

## サウンドフィードバック機能（2026年3月10日）
**Web Audio API シンセ音による操作フィードバック**

### 技術的成果
- Web Audio API でシンセ音を生成（外部ファイル不要・軽量）
- 17種のサウンド定義（銘柄追加・自動保存・D&D・エラー・トースト等）
- toast.ts と同じシングルトン Pub/Sub ストアパターンで設計
- useSyncExternalStore によるリアクティブな設定管理
- autoplay policy 対応（初回クリックで AudioContext を resume）
- ON/OFF トグル・音量スライダー・プレビュー再生の設定UI
- localStorage による設定永続化
- 全テストでの Web Audio API 依存を排除するグローバルモック

### 新規ファイル
- `src/lib/sound.ts` - サウンドエンジン本体
- `src/hooks/useSound.ts` - 設定管理フック
- `src/components/SoundSettings.tsx` - 設定UI
- `src/__tests__/unit/sound.test.ts` - エンジンテスト（12件）
- `src/__tests__/hooks/useSound.test.ts` - フックテスト（5件）

### 変更ファイル
- 10個のフックにサウンド再生を統合
- toast.ts にトースト種別ごとの音を統合
- page.tsx に銘柄追加/削除/D&D音と autoplay 初期化を追加
- SearchBar.tsx に検索クリア音を追加
- SlideOutMenu.tsx にサウンド設定セクションを配置

---

## Phase 1 完了（2026年2月28日達成）
**localStorage → データベース統合 完全移行成功**

### 技術的成果
- Supabase + Prisma + Next.js 16 完全統合
- Google OAuth + Magic Link 認証システム
- 13テーブル設計 PostgreSQLスキーマ
- Row Level Security データ保護実装
- ハイブリッドデータシステム 構築
- Transaction Pooler 高効率DB接続
- PKCE対応 セキュア認証フロー

### 解決した技術課題
- Next.js 16 Cookie API変更対応
- Prisma 7 PostgreSQLアダプター実装
- snake_case <-> camelCase マッピング完全対応
- Supabase SSL接続最適化
- OAuth Server Beta問題解決

---

## Phase 2 完了（2026年3月達成）
**DB統合の完成：ポジション・株価・メモの全面DB対応**

### 技術的成果
- StockPosition 複数レコード設計（購入ロットごとに1レコード・正規設計に復元）
- stock_prices DB統合（現在株価・利確目標・損切りラインをDB管理）
- useStockPrice hook 新規：価格データのDB同期（300msデバウンス自動保存）
- useStockPosition hook 複数ポジションCRUD（追加・編集・削除）
- resolveStockId() パターン 全APIルートで `stock-SYMBOL` → DB UUID 変換を統一
- SimplePortfolioSummary DB価格データをポートフォリオサマリーに反映
- stocks/list API 拡張 価格データ込みで返却（N+1クエリ排除）

### 解決した技術課題
- `stock-SYMBOL` 形式のIDをDB UUIDに変換する `resolveStockId()` を全ルートに実装
- `StockPosition` の `@unique` 誤設定を複数レコード設計に修正
- DB接続：Transaction Pooler(6543)はDDL不可、Session Pooler(5432)を使用
- RLS ポリシー：`app_users.id` は `user_id` ではなく `id` でアクセス制御
- Prisma `--force-reset` 後のRLSポリシー再設定（`docs/patterns.md` 参照）

### APIルート構成（`src/app/api/stocks/`）
| ルート | メソッド | 説明 |
|--------|---------|------|
| `/` | POST | 銘柄新規作成（ensureUser + 重複チェック） |
| `/` | DELETE | 銘柄削除（カスケード削除） |
| `list` | GET | 銘柄一覧（価格・イベント・配当・優待データ込み） |
| `[stockId]/memo` | GET/PUT/DELETE | 株ノオト |
| `[stockId]/price` | GET/PUT | 株価情報（現在株価・目標・損切り） |
| `[stockId]/position` | GET/POST | ポジション一覧・追加 |
| `[stockId]/position/[positionId]` | PUT/DELETE | 個別ポジション編集・削除 |
| `[stockId]/next-action-plan` | GET/PUT/DELETE | 次の一手戦略 |

---

## DB_5 完了（2026年3月達成）
**お気に入りグループ DB完全移行**

### 技術的成果
- StockFavoriteGroup 中間テーブル追加（お気に入りグループ x 銘柄の多対多管理）
- useFavoriteGroups hook DB/localStorageハイブリッド・楽観的更新・差分同期
- /api/favorite-groups 系APIルート 一覧・作成・更新・削除・銘柄紐付け

### 解決した技術課題
- 楽観的更新で操作レスポンスを維持しつつDB同期

---

## DB_6 完了（2026年3月達成）
**イベント情報（決算日・株主総会日）DB完全移行**

### 技術的成果
- StockEvent テーブル拡張 `event_month`, `event_day`, `is_recurring`, `is_active` カラム追加
- UNIQUE制約追加 `stock_id + event_type`（1銘柄につき各イベント1件）
- useStockEvent hook 新規：DB/localStorageハイブリッド・500msデバウンス自動保存
- /api/stocks/[stockId]/event GET/PUT/DELETE APIルート追加
- StockCard.tsx 移行 localStorage → useStockEvent hook

### 解決した技術課題
- マイグレーション前の重複レコード削除（DISTINCT ON で最新レコードを残す）
- 既存 `SHAREHOLDER_MEETING` レコードの `event_date` → `event_month`/`event_day` データ移行SQL
- `prisma generate` 後は開発サーバー再起動が必要（node_modules キャッシュ問題）

---

## DB_7 完了（2026年3月達成）
**投資カレンダーのDB対応（スケジュールサマリー反映）**

### 技術的成果
- stocks/list API 拡張 events・dividend・benefit データを含めて返却
- 投資カレンダー DB 反映 認証済みユーザーは DB のイベントデータをカレンダーに反映
- リアルタイムカレンダー更新 `useStockEvent` 保存後に `kabunote-db-calendar-update` カスタムイベントで即時反映

### 解決した技術課題
- `page.tsx` の `updateCalendarData` が localStorage のみ参照していたため、DB に保存したイベントがカレンダーに反映されない不具合を修正
- 認証済み時は `stockData`（DB取得済み）から決算日・株主総会日・配当権利確定日・優待権利確定日を組み立てるよう修正
- カード上での変更 → DB 保存 → カスタムイベント → `refreshData()` → カレンダー更新のリアルタイム同期フローを確立

---

## DB_10 完了（2026年3月達成）
**タグのDB完全移行**

### 技術的成果
- useStockTag hook 新規：タグのDB/localStorageハイブリッド管理（楽観的更新・localStorage→DB自動移行）
- /api/stocks/[stockId]/tag GET/POST APIルート追加（resolveStockId + upsert）
- /api/stocks/[stockId]/tag/[tagId] DELETE APIルート追加
- stocks/list API `tags: true` include追加、`tags: []` ハードコード削除
- StockCard.tsx `useArrayLocalStorage` → `useStockTag` に切り替え
- TagEditor.tsx `onTagsChange` → `onAddTag`/`onRemoveTag` 個別コールバックに変更
- RLS ポリシー設定が必要（`docs/patterns.md` 参照）

### 解決した技術課題
- `stock_tags` テーブルは既存だったが API・hook が未実装でタグが常に空だった問題を解消
- 既存 localStorage データの自動DB移行ロジックを `useStockTag` に実装
- 楽観的更新（即時UI反映 + バックグラウンドDB保存/ロールバック）パターン

---

## feature/n+1 完了（2026年3月達成）
**N+1クエリ解消 + 投資余力現金・Next ActionメモのDB永続化**

### 技術的成果
- N+1クエリ解消 `/api/stocks/list` に `positions` を含め、銘柄ごとの個別API呼び出しを廃止
- PortfolioSummary 常時表示 投資余力現金・Next Actionメモをポジション非依存で常時表示
- useCash DB永続化 投資余力現金・Next ActionメモをDBに保存（ページリロード・デバイス変更後も保持）
- useCash 動的ユーザーID対応 ハードコードUUIDを廃止し、Supabase `getSession()` から実際の認証ユーザーIDを取得
- useCash デバウンス対応 update関数に300msデバウンスを追加し、タイピング中の過剰API呼び出しを防止

### 解決した技術課題
- `PortfolioSummary.tsx` が `useStringLocalStorage` を使っており localStorage 消去で値が消えるバグを修正 → `useCash` に移行
- `useCash.ts` のハードコード UUID（`550e8400-...`）が原因で実際のユーザーデータを取得・保存できなかった問題を修正
- 即時UI更新（`setState`） + デバウンスDB保存のパターンを `useCash` に実装

---

## DB_13 完了（2026年3月達成）
**株主優待管理のDB完全移行**

### 技術的成果
- useStockBenefit hook 新規作成（DB/localStorageハイブリッド・500msデバウンス・localStorage→DB自動移行）
- /api/stocks/[stockId]/benefit GET/PUT/DELETE APIルート新規作成
- ShareholderBenefitManagement.tsx: props削除・`useStockBenefit` hook に切替（権利確定日設定も内包）
- ManagementTab.tsx: `shareholderRightsSettings`・`onShareholderRightsSettingsChange` props を削除
- StockCard.tsx: localStorage株主優待権利確定日状態（`shareholderRightsSettings`）を削除
- カレンダー連動: 優待データ保存時に `kabunote-db-calendar-update` イベント発火

### 解決した技術課題
- `ShareholderBenefitManagement` が優待内容と権利確定日を別々に管理していた設計を統合
- `StockCard` → `ManagementTab` → `ShareholderBenefitManagement` と流れていたpropsチェーンをhookで完全自己完結化
- `isRecurring` フィールドはDBに保持しない（DB保存時は rightsMonth/rightsDay のみ、読み出し時に `isRecurring: true` で復元）

---

## feature/new 完了（2026年3月達成）
**認証フロー修正・ログイン必須化・localStorageフォールバック削除**

### 技術的成果
- ログイン必須化 ミドルウェアで未認証→/login リダイレクト
- localStorageフォールバック完全削除 全データDBのみ管理
- PKCE認証フロー修正 `/auth/callback` でコード交換→セッション確立→`/` リダイレクト
- login/page.tsx Google OAuth・Magic Link の `redirectTo` を `/auth/callback` に統一
- 初回ログイン対応 `/api/cash` でユーザー未存在時にデフォルト値を返却（404エラー解消）

### 解決した技術課題
- `/auth/callback/route.ts` が `exchangeCodeForSession()` を呼ばず `/auth/success` にリダイレクトするだけだったため、セッション未確立→白画面になっていた問題を修正
- `NextResponse.redirect()` に cookie をセットするため、`setAll` で `cookieStore` と `response.cookies` の両方に書き込むパターンを実装
- 初回ログイン時に `app_users` レコードが存在せず `/api/cash` が 404 を返しエラーになっていた問題を修正

### Supabase ダッシュボード設定（手動対応必要）
- Authentication > URL Configuration > Redirect URLs に `/auth/callback` を追加（本番・ローカル両方）

---

## DB_12 完了（2026年3月達成）
**配当管理のDB完全移行**

### 技術的成果
- useStockDividend hook 新規作成（DB/localStorageハイブリッド・500msデバウンス・localStorage→DB自動移行）
- /api/stocks/[stockId]/dividend GET/PUT/DELETE APIルート新規作成
- DividendManagement.tsx: props削除・`useStockDividend` hook に切替（dividendFrequency は string→number 型に変更）
- StockCard.tsx・ManagementTab.tsx: dividendRightsSettings props を削除
- page.tsx の `getDividendBenefitData`: 認証済み時は `stockData.dividend` を参照するよう修正

### 手動対応必要
- Supabase Dashboard > SQL Editor でRLSポリシー設定（`docs/patterns.md` 参照）
