# Kabunote - プロジェクトマイルストーン

## Phase 1.5: 投資チェックリスト自動チェック化（2026年3月15日）
**各操作完了時にチェックリストが自動でチェックされる仕組みを追加**

### 機能概要
- 株価更新・アラート確認・Next Action見直し・株ノオト更新の各操作完了時に自動チェック
- 手動でのチェック/アンチェックも引き続き可能
- 自動チェック時もサウンドフィードバックあり

### 変更ファイル
- `src/hooks/useStockMemo.ts` - `kabunote-db-memo-update`イベント追加
- `src/app/dashboard/page.tsx` - アラートモーダル閉時に`kabunote-alert-reviewed`イベント発火
- `src/hooks/useChecklist.ts` - 4つのカスタムイベントをリッスンし自動チェック
- `docs/patterns.md` - チェックリスト自動チェックパターン追記
- `docs/architecture.md` - useChecklistの説明更新

---

## Phase 1.5: 投資チェックリスト機能（2026年3月14日）
**デイリーエンゲージメント強化 - 固定4項目のチェックリスト + 連続達成日数（ストリーク）カウント**

### 機能概要
- 毎日の投資ルーティン4項目をチェック（株価更新・アラート確認・Next Action見直し・株ノオト更新）
- 1つでもチェックすればその日は完了扱い（ハードル低く継続しやすい）
- 連続達成日数（ストリーク）を自動カウント・バッジ表示（日数で色変化）
- プログレスバーでX/4完了を可視化
- 全完了時に祝福演出（サウンド + メッセージ）

### 新規ファイル
- `src/types/checklist.ts` - CHECKLIST_ITEMS定数・型定義
- `src/lib/checklistCalc.ts` - ストリーク計算・日付ユーティリティ
- `src/app/api/checklist/route.ts` - GET/PUT APIルート
- `src/hooks/useChecklist.ts` - モジュールキャッシュ・楽観的更新・デバウンス
- `src/components/DailyChecklist.tsx` - UIコンポーネント
- `src/__tests__/unit/checklistCalc.test.ts` - ユニットテスト（11テスト）
- `src/__tests__/api/checklist.test.ts` - APIテスト（7テスト）

### 変更ファイル
- `prisma/schema.prisma` - DailyChecklistモデル追加（17テーブルに）
- `src/__tests__/mocks/prisma.ts` - dailyChecklistモック追加
- `src/app/dashboard/page.tsx` - DailyChecklist配置（DailyQuote直下）
- `docs/architecture.md` - テーブル・API・フック・型定義追記
- テスト: 68→70ファイル、517→535テスト（+18テスト）

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
