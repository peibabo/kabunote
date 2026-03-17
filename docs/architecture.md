# Kabunote - アーキテクチャリファレンス

## データベーススキーマ（19テーブル）

```
app_users (ユーザー管理)
  id, email, name, picture, auth_provider, cash_amount, next_action_memo, onboarding_completed
  ├── stocks (銘柄マスター)
  │     id, user_id, symbol, name, sector, market, order
  │     @@unique([userId, symbol])
  │     ├── stock_memos        1:1  content
  │     ├── stock_prices       1:1  current_price, target_price, stop_loss_price
  │     ├── stock_positions    1:N  shares, purchase_price, purchase_date, memo
  │     ├── stock_events       1:N  event_type(ENUM), event_date, event_month, event_day, is_recurring, is_active
  │     │                           @@unique([stockId, eventType])
  │     ├── stock_dividends    1:1  dividend_per_share, frequency, rights_month, rights_day
  │     ├── stock_benefits     1:1  description, minimum_shares, estimated_value, rights_month, rights_day
  │     ├── stock_tags         1:N  name, color  @@unique([stockId, name])
  │     ├── next_action_plans  1:1  action_type(ENUM), priority(ENUM), target_price, target_shares, strategy_memo
  │     ├── stock_tab_states   1:N  tab_type, current_tab  @@unique([stockId, tabType])
  │     └── stock_favorite_groups (中間テーブル)  @@unique([stockId, groupId])
  ├── favorite_groups (お気に入りグループ)
  │     id, user_id, name, color, order  @@unique([userId, name])
  ├── snoozed_alerts (アラートスヌーズ管理)
  │     id, user_id, stock_symbol, alert_type(ENUM), snooze_until
  ├── feedbacks (フィードバック・目安箱)
  │     id, user_id, category(ENUM), content, created_at
  ├── user_external_links (外部リンク設定)
  │     id, user_id, url, label, icon, gradient, order
  ├── portfolio_snapshots (ポートフォリオ日次スナップショット)
  │     id, user_id, snapshot_date, total_investment, total_value, profit_loss, cash_amount, net_assets
  │     @@unique([userId, snapshotDate])
  │     └── stock_price_snapshots (銘柄別日次株価スナップショット)
  │           id, snapshot_id, stock_id, symbol, current_price, shares, value, cost
  │           @@unique([snapshotId, stockId])
  └── chart_memos (チャートメモ: グラフデータポイントへのメモ)
        id, user_id, snapshot_date, chart_type, symbol, content
        @@unique([userId, snapshotDate, chartType, symbol])
```

### Enum定義
- **EventType**: `EARNINGS`, `SHAREHOLDER_MEETING`
- **ActionType**: `BUY`, `SELL`, `HOLD`
- **Priority**: `HIGH`, `MEDIUM`, `LOW`
- **AlertType**: `FUND_SHORTAGE`, `STOP_LOSS_EXCEEDED`, `NEXT_ACTION_URGENT`, `STOP_LOSS_APPROACHING`, `PROFIT_TARGET_APPROACHING`, `NEXT_ACTION_WARNING`
- **FeedbackCategory**: `FEATURE_REQUEST`, `IMPROVEMENT`, `BUG_REPORT`, `OTHER`

---

## APIルート一覧

### 認証・ユーザー
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/auth/sync-user` | POST | Supabase認証後のユーザー同期 |
| `/api/cash` | GET/PUT | 投資余力現金・Next Actionメモの取得・更新 |
| `/api/onboarding` | GET/POST | オンボーディング完了状態の取得・更新 |
| `/api/external-links` | GET/PUT | 外部リンク設定の取得・一括更新（最大8個） |

### 銘柄
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/stocks` | POST/DELETE | 銘柄作成（ensureUser + 重複チェック）/ 削除（カスケード） |
| `/api/stocks/list` | GET | 全銘柄一覧（prices, events, dividend, benefit, tags, positions 込み） |
| `/api/stocks/reorder` | PUT | 銘柄の表示順序変更 |
| `/api/stocks/[stockId]/memo` | GET/PUT/DELETE | 株ノオト CRUD |
| `/api/stocks/[stockId]/price` | GET/PUT | 株価情報（現在株価・目標・損切り） |
| `/api/stocks/[stockId]/position` | GET/POST | ポジション一覧・追加 |
| `/api/stocks/[stockId]/position/[positionId]` | PUT/DELETE | 個別ポジション編集・削除 |
| `/api/stocks/[stockId]/event` | GET/PUT/DELETE | 決算日・株主総会日 |
| `/api/stocks/[stockId]/dividend` | GET/PUT/DELETE | 配当情報 |
| `/api/stocks/[stockId]/benefit` | GET/PUT/DELETE | 株主優待情報 |
| `/api/stocks/[stockId]/tag` | GET/POST | タグ一覧・追加 |
| `/api/stocks/[stockId]/tag/[tagId]` | DELETE | タグ削除 |
| `/api/stocks/[stockId]/next-action-plan` | GET/PUT/DELETE | 次の一手戦略 |
| `/api/stocks/[stockId]/price-history` | GET | 個別銘柄の株価履歴（?range=1M/3M/6M/1Y/2Y、デフォルト3M） |

### ポートフォリオ履歴
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/portfolio/snapshot` | POST | ポートフォリオ日次スナップショット作成/更新（同日upsert） |
| `/api/portfolio/history` | GET | ポートフォリオ履歴取得（?range=1W/1M/3M/6M/1Y/2Y） |
| `/api/portfolio/chart-memos` | GET | チャートメモ一覧取得（?range=1W/1M/3M/6M/1Y/2Y） |
| `/api/portfolio/chart-memos` | PUT | チャートメモ作成/更新（snapshotDate, chartType, symbol?, content） |
| `/api/portfolio/chart-memos` | DELETE | チャートメモ削除（?snapshotDate&chartType&symbol） |

### フィードバック
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/feedback` | POST | フィードバック（目安箱）送信（Slack通知付き） |

### お気に入りグループ
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/favorite-groups` | GET/POST | グループ一覧・作成 |
| `/api/favorite-groups/[groupId]` | PUT/DELETE | グループ更新・削除 |
| `/api/favorite-groups/[groupId]/stocks` | PUT | グループへの銘柄紐付け |

### タグ
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/tags` | GET | 全タグ一覧 |

---

## カスタムフック一覧（44フック）

### `hooks/stock/` — 銘柄データ
| フック | 説明 |
|--------|------|
| `useStockData` | 銘柄データ一括取得（stocks/list API） |
| `useStockCardData` | 銘柄カード統合データ（10+フックのファサード） |
| `useStockMemo` | 株ノオト（デバウンス自動保存） |
| `useStockPrice` | 株価データ（現在株価・利確目標・損切り）300msデバウンス |
| `useStockPosition` | 複数ポジションCRUD（追加・編集・削除） |
| `useStockEvent` | 決算日・株主総会日（500msデバウンス） |
| `useStockDividend` | 配当情報（500msデバウンス） |
| `useStockBenefit` | 株主優待情報（500msデバウンス） |
| `useStockTag` | タグ管理（楽観的更新） |
| `useStockPriceHistory` | 個別銘柄の株価履歴取得（期間切替・スナップショットイベント連動） |
| `useStockSearch` | 銘柄検索（オートコンプリート） |

### `hooks/alert/` — アラート
| フック | 説明 |
|--------|------|
| `useStockAlerts` | アラート計算・カードスタイル |
| `useAlertCounts` | ヘッダー用アラート集計 |
| `useAlertSummaryData` | アラート一覧テーブルデータ |
| `useSnooze` | アラートスヌーズ管理 |

### `hooks/portfolio/` — ポートフォリオ
| フック | 説明 |
|--------|------|
| `usePortfolioData` | ポートフォリオ集計データ |
| `usePortfolioSummary` | ポートフォリオサマリー（投資額・損益・配当・優待） |
| `usePieChartData` | 円グラフデータ生成 |
| `usePortfolioHistory` | ポートフォリオ日次スナップショット履歴（期間切替・作成・todayRecorded） |
| `useChartMemos` | チャートメモ管理（memoMap・saveMemo・deleteMemo） |

### `hooks/calendar/` — カレンダー
| フック | 説明 |
|--------|------|
| `useCalendarData` | カレンダー用イベントデータ |
| `useEventCalendarData` | イベントカレンダーデータ（フィルタ・ソート） |

### `hooks/dividend/` — 配当・優待
| フック | 説明 |
|--------|------|
| `useDividendBenefitData` | 配当・優待一覧データ |
| `useDividendBenefitList` | 配当・優待リスト（ソート・フィルタ・検索） |

### `hooks/dashboard/` — ダッシュボード
| フック | 説明 |
|--------|------|
| `useModals` | モーダル表示状態 |
| `useDashboardActions` | ダッシュボード操作（銘柄追加・削除・D&D） |
| `useFavoriteGroups` | お気に入りグループ（楽観的更新・差分同期） |
| `useExternalLinks` | 外部リンク設定（モジュールキャッシュ・デフォルトフォールバック） |

### `hooks/auth/` — 認証・グローバル
| フック | 説明 |
|--------|------|
| `useAuth` | Supabase認証状態管理 |
| `useCash` | 投資余力現金・Next Actionメモ（300msデバウンス） |
| `useSound` | サウンド設定 |
| `useSoundOnChange` | 値変更時のサウンド再生 |

### `hooks/tab/` — タブ状態
| フック | 説明 |
|--------|------|
| `useTabState` | メインタブ状態 |
| `useInvestmentTabState` | 投資戦略サブタブ状態 |
| `useManagementTabState` | 管理サブタブ状態 |

### `hooks/util/` — ユーティリティ
| フック | 説明 |
|--------|------|
| `useDebounce` | デバウンス汎用 |
| `useLocalStorage` | localStorage汎用ラッパー |
| `useAutoSave` | 自動保存ロジック |
| `useAsyncState` | 非同期状態管理 |
| `useAccordionState` | アコーディオン開閉管理（playSound統合・localStorage対応） |
| `useTooltipState` | ツールチップ表示/非表示管理（遅延非表示・クリーンアップ） |

### `hooks/other/` — その他
| フック | 説明 |
|--------|------|
| `useOnboarding` | オンボーディング完了状態 |
| `useNextActionPlan` | 次の一手戦略 |

---

## 型定義ファイル一覧（12ファイル）

型定義のみ。計算ロジック・フォーマット関数は `src/lib/*Calc.ts` に分離済み。

| ファイル | 内容 |
|---------|------|
| `positions.ts` | Position, PositionSummary（totalCost, positionCount等） |
| `tags.ts` | CustomTag, プリセットタグ定義 |
| `favorites.ts` | FavoriteGroup, お気に入りグループ |
| `dividend.ts` | DividendInfo, DividendCalculation, PortfolioDividendSummary |
| `shareholder.ts` | ShareholderBenefit, ShareholderBenefitInfo, PortfolioShareholderSummary |
| `rightsDate.ts` | RightsDateSettings（権利確定日共通型） |
| `nextActionPlan.ts` | NextActionPlan, NextActionPlanAnalysis, ActionType, Priority |
| `investmentTabs.ts` | InvestmentTabType |
| `managementTabs.ts` | ManagementTabType |
| `investmentCalendar.ts` | InvestmentEvent, CalendarDay, TimelineEvent, EventSummary |
| `snooze.ts` | SnoozeDuration, SnoozedAlert |
| `portfolio.ts` | PortfolioSnapshotData, StockSnapshotData, HistoryRange, ChartType |

---

## 認証フロー

```
ユーザー → / (LP) → /login (Google OAuth / Magic Link)
  → Supabase Auth → /auth/callback/route.ts
  → exchangeCodeForSession() → セッション確立 → /dashboard にリダイレクト
  → middleware.ts (/dashboard 未認証 → /login リダイレクト、/ 認証済み → /dashboard リダイレクト)
  → API呼び出し時: Supabase getSession() → userId取得
  → Prisma経由でPostgreSQL (RLS適用)
```

---

## コンポーネント構成（機能別ディレクトリ）

### `components/layout/` — レイアウト
- `DashboardHeader.tsx`, `DashboardModals.tsx`, `SlideOutMenu.tsx`, `HamburgerMenuButton.tsx`
- `BulkTabSwitcher.tsx`, `ToastContainer.tsx`, `CookieConsentBanner.tsx`, `GoogleAnalyticsWrapper.tsx`

### `components/stock/` — 銘柄
- `StockCard.tsx`: 銘柄カード（タブ制御・統合アラート・スマートナビゲーション）
- `StockCardHeader.tsx`, `StockInput.tsx`, `SearchBar.tsx`, `StockMiniChart.tsx`
- `FloatingAddButton.tsx`, `SimplePortfolioSummary.tsx`

### `components/stock-tabs/` — 銘柄カードタブ
- `BasicTab.tsx`, `InvestmentStrategyTab.tsx`, `ManagementTab.tsx`
- `AnalysisSubTab.tsx`, `NextActionSubTab.tsx`
- `PositionsManagement.tsx`, `EventManagement.tsx`, `DividendManagement.tsx`, `ShareholderBenefitManagement.tsx`

### `components/portfolio/` — ポートフォリオ
- `PortfolioSummary.tsx`, `PortfolioOverviewGrid.tsx`, `InvestmentPieChart.tsx`
- `CashPositionSection.tsx`, `TargetSummarySection.tsx`
- `PortfolioHistory.tsx`, `PortfolioChart.tsx`, `ChartMemoModal.tsx`

### `components/alert/` — アラート
- `AlertDisplay.tsx`, `AlertSummaryPage.tsx`

### `components/calendar/` — カレンダー
- `InvestmentCalendar.tsx`, `InvestmentTimeline.tsx`, `MonthlyCalendar.tsx`, `TodayTomorrowEvents.tsx`

### `components/summary/` — 一覧ページ
- `PortfolioPositionsPage.tsx`, `DividendBenefitListPage.tsx`, `StrategySummaryPage.tsx`, `EventCalendarPage.tsx`

### `components/tag/` — タグ・グループ
- `TagEditor.tsx`, `TagManager.tsx`, `FavoriteGroupManager.tsx`, `FavoriteGroupSelector.tsx`

### `components/settings/` — 設定
- `ExternalLinksArea.tsx`, `ExternalLinksSettingsModal.tsx`, `SoundSettings.tsx`, `DailyQuote.tsx`, `FloatingSnapshotButton.tsx`

### `components/modal/` — モーダル
- `FeedbackModal.tsx`, `DeleteAccountModal.tsx`

### `components/auth/` — 認証
- `AuthButton.tsx`

### `components/landing/` — LP（既存）
### `components/onboarding/` — オンボーディング（既存 + OnboardingWizard.tsx）

---

## ライブラリ（src/lib/）

| ファイル | 説明 |
|---------|------|
| `supabase.ts` | Supabaseクライアント設定 |
| `supabase-client.ts` | ブラウザ用Supabaseクライアント |
| `supabase-server.ts` | サーバー用Supabaseクライアント |
| `prisma.ts` | Prismaクライアント設定 |
| `resolveStockId.ts` | `stock-SYMBOL` → DB UUID 変換 |
| `storageKeys.ts` | localStorage キー一元管理（UI状態のみ） |
| `apiClient.ts` | API呼び出しヘルパー |
| `apiHandler.ts` | APIルート共通ハンドラー |
| `toast.ts` | トースト通知 |
| `sound.ts` | サウンドフィードバックエンジン（Web Audio API） |
| `slack.ts` | Slack Webhook通知（フィードバック受信時） |
| `positionCalc.ts` | ポジション計算・フォーマット関数 |
| `dividendCalc.ts` | 配当計算・フォーマット関数 |
| `shareholderCalc.ts` | 株主優待計算・フォーマット関数 |
| `investmentCalendarCalc.ts` | 営業日計算・権利付最終日・日付フォーマット |
| `snoozeCalc.ts` | スヌーズ期間定数・ラベル・残り時間計算 |
| `nextActionPlanCalc.ts` | Next Action Plan分析・判定関数 |
| `snapshotCalc.ts` | ポートフォリオスナップショット計算（buildSnapshotData, RANGE_DAYS） |
| `stockMiniChartCalc.ts` | 個別銘柄ミニチャート計算（YAxis domain計算・日付フォーマット・データ変換） |
| `dateFormat.ts` | 日付フォーマット共通関数（ISO形式・M/D形式） |

## ユーティリティ（src/utils/）

| ファイル | 説明 |
|---------|------|
| `alertSystem.ts` | 6段階アラート計算ロジック |
| `timelineUtils.ts` | タイムライン表示ヘルパー（イベントスタイル・営業日計算等） |
