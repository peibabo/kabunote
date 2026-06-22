# Kabunote - アーキテクチャリファレンス

## データベーススキーマ（27テーブル）

```
app_users (ユーザー管理)
  id, email, name, picture, auth_provider, cash_amount, next_action_memo, onboarding_completed
  ├── stocks (銘柄マスター)
  │     id, user_id, symbol, name, sector, market, order
  │     @@unique([userId, symbol])
  │     ├── stock_memos        1:1  content
  │     ├── stock_prices       1:1  current_price, target_price, stop_loss_price, per, pbr
  │     ├── stock_positions    1:N  shares, purchase_price, purchase_date, memo, tax_rate(0=NISA/0.20315=特定口座)
  │     ├── realized_trades     1:N  sold_shares, sell_price, cost_basis(加重平均), sell_date, realized_pl, tax_rate, consumed_lots(JSONB:取得日内訳), memo（売却＝確定損益記録）
  │     ├── stock_events       1:N  event_type(ENUM), event_date, event_month, event_day, is_recurring, is_active
  │     │                           @@unique([stockId, eventType])
  │     ├── stock_dividends    1:1  dividend_per_share, frequency, rights_month, rights_day
  │     ├── stock_benefits     1:1  description, minimum_shares, estimated_value, rights_month, rights_day
  │     ├── stock_tags         1:N  name, color  @@unique([stockId, name])
  │     ├── next_action_plans  1:1  action_type(ENUM), priority(ENUM), target_price, target_shares, strategy_memo
  │     ├── stock_tab_states   1:N  tab_type, current_tab  @@unique([stockId, tabType])
  │     ├── stock_news_items   1:N  url, comment, order  @@index([stockId]) @@index([userId, createdAt DESC])
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
  ├── chart_memos (チャートメモ: グラフデータポイントへのメモ)
  │     id, user_id, snapshot_date, chart_type, symbol, content
  │     @@unique([userId, snapshotDate, chartType, symbol])
  ├── user_gamification (ゲーミフィケーション状態)
  │     id, user_id(UNIQUE), total_xp, level, daily_xp, daily_xp_date, current_streak, longest_streak, last_active_date, notified_title_ids
  ├── xp_activity_logs (XPアクティビティログ)
  │     id, user_id, action_type, xp_earned, description
  │     @@index([userId, createdAt DESC])
  ├── user_checklists (デイリーチェックリスト項目)
  │     id, user_id, label, order
  │     @@index([userId])
  ├── checklist_checks (チェックリスト日次チェック記録)
  │     id, checklist_id, user_id, checked_date
  │     @@unique([checklistId, checkedDate])
  │     @@index([userId, checkedDate])
  └── investment_diaries (投資日記: 1日1記録)
        id, user_id, diary_date, market_overview, news_memo, reflection, tomorrow_focus
        @@unique([userId, diaryDate])
        @@index([userId, diaryDate DESC])
        └── diary_news_items (日記ニュースアイテム)
              id, diary_id, user_id, url, comment, order
              @@index([diaryId])
              @@index([userId, createdAt DESC])
  └── user_stock_link_settings (銘柄カード外部リンク設定)
        id, user_id(UNIQUE), settings(JSONB: [{key, visible, order}])
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
| `/api/stock-link-settings` | GET/PUT | 銘柄カード外部リンクの表示/非表示・順番設定 |

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
| `/api/stocks/[stockId]/position/sell` | POST/GET | ポジション売却（確定損益記録・加重平均原価でロット消し込み）/ 銘柄別確定損益履歴 |
| `/api/stocks/[stockId]/event` | GET/PUT/DELETE | 決算日・株主総会日 |
| `/api/stocks/[stockId]/dividend` | GET/PUT/DELETE | 配当情報 |
| `/api/stocks/[stockId]/benefit` | GET/PUT/DELETE | 株主優待情報 |
| `/api/stocks/[stockId]/tag` | GET/POST | タグ一覧・追加 |
| `/api/stocks/[stockId]/tag/[tagId]` | DELETE | タグ削除 |
| `/api/stocks/[stockId]/next-action-plan` | GET/PUT/DELETE | 次の一手戦略 |
| `/api/stocks/[stockId]/price-history` | GET | 個別銘柄の株価履歴（?range=1M/3M/6M/1Y/2Y、デフォルト3M、各点に snapshotId 付与＝過去株価修正用） |
| `/api/stocks/[stockId]/news` | GET/PUT | 銘柄ニュース取得・一括更新（最大20件、URL+コメント） |

### ポートフォリオ履歴
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/portfolio/snapshot` | POST | ポートフォリオ日次スナップショット作成/更新（同日upsert） |
| `/api/portfolio/snapshot/[id]` | PATCH | 過去スナップショットの個別株価修正（stockPrices:[{stockId,currentPrice}]）。当日分は不可（昨日以前のみ）・所有者外は404。評価額/損益/純資産を再計算 |
| `/api/portfolio/realized` | GET | 確定損益一覧（?year=YYYY で年フィルタ・年間損益サマリー用。実現損益＋売却代金合計・税引後手取りを集計） |
| `/api/portfolio/realized/[tradeId]` | DELETE | 確定損益（売却記録）の削除。レコードのみ削除し保有ポジションには触れない（株数は戻さない） |
| `/api/portfolio/history` | GET | ポートフォリオ履歴取得（?range=1W/1M/3M/6M/1Y/2Y&detail=false で銘柄別スナップショット省略） |
| `/api/portfolio/chart-memos` | GET | チャートメモ一覧取得（?range=1W/1M/3M/6M/1Y/2Y） |
| `/api/portfolio/chart-memos` | PUT | チャートメモ作成/更新（snapshotDate, chartType, symbol?, content） |
| `/api/portfolio/chart-memos` | DELETE | チャートメモ削除（?snapshotDate&chartType&symbol） |
| `/api/portfolio/chart-memos/list` | GET | チャートメモ一覧取得（?limit&offset&chartType=all/value/netAssets/profitLoss/stocks） |

### ゲーミフィケーション
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/gamification` | GET | ゲーミフィケーション状態取得（初回自動作成） |
| `/api/gamification/xp` | POST | XP付与（日次上限・ストリーク・レベルアップ判定） |
| `/api/gamification/activity` | GET | 直近30件のXPアクティビティログ |
| `/api/gamification/titles` | GET | 称号コレクション状態（集計+全28称号の獲得判定） |

### チェックリスト
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/checklist` | GET | チェックリスト項目一覧 + 今日のチェック状態 |
| `/api/checklist` | POST | 項目追加 |
| `/api/checklist` | PUT | 項目一括更新（並び替え・テキスト編集） |
| `/api/checklist/[itemId]` | DELETE | 項目削除 |
| `/api/checklist/check` | POST | チェック登録 |
| `/api/checklist/check` | DELETE | チェック解除 |
| `/api/checklist/preset` | POST | プリセット一括登録 |

### 投資日記
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/diary` | GET | 日記取得（?date=YYYY-MM-DD, newsItems含む）または月の日記日付リスト（?month=YYYY-MM） |
| `/api/diary` | PUT | 日記保存（upsert: date, marketOverview, newsItems[], reflection, tomorrowFocus） |
| `/api/diary/news` | GET | ニュース一覧（?limit&offset&source=all/diary/stock） |

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

## カスタムフック一覧（48フック）

### `hooks/stock/` — 銘柄データ
| フック | 説明 |
|--------|------|
| `useStockData` | 銘柄データ一括取得（stocks/list API）、ファサード |
| `useStockCrud` | 銘柄追加ロジック（楽観的更新 + DB INSERT） |
| `useStockCardData` | 銘柄カード統合データ（10+フックのファサード） |
| `useStockMemo` | 株ノオト（デバウンス自動保存） |
| `useStockNews` | 銘柄ニュース管理（URL+コメント、300msデバウンス自動保存） |
| `useStockPrice` | 株価データ（現在株価・利確目標・損切り）300msデバウンス |
| `useStockPosition` | 複数ポジションCRUD（追加・編集・削除・売却） |
| `useRealizedTrades` | 銘柄別の確定損益履歴取得（売却イベント連動） |
| `useStockEvent` | 決算日・株主総会日（500msデバウンス） |
| `useStockDividend` | 配当情報（500msデバウンス） |
| `useStockBenefit` | 株主優待情報（500msデバウンス） |
| `useStockTag` | タグ管理（楽観的更新） |
| `useStockPriceHistory` | 個別銘柄の株価履歴取得（期間切替・スナップショットイベント連動・updateSnapshotPrice=過去株価修正） |
| `useTradeMarkers` | 銘柄の購入ロット・売却履歴を取得しチャートマーカー用に整形（読み取り専用・購入/売却イベント連動でライブ更新） |
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
| `usePortfolioHistory` | ポートフォリオ日次スナップショット履歴（期間切替・作成・todayRecorded・updateSnapshotPrices=過去株価修正） |
| `usePortfolioRealizedTrades` | ポートフォリオ全体の確定損益履歴・年間集計（年フィルタ） |
| `useChartMemos` | チャートメモ管理（memoMap・saveMemo・deleteMemo） |
| `useChartMemoList` | チャートメモ一覧（ページネーション・フィルタ・削除） |

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
| `useMonthlyDividendData` | 月別配当受取データ計算 |

### `hooks/dashboard/` — ダッシュボード
| フック | 説明 |
|--------|------|
| `useModals` | モーダル表示状態 |
| `useDashboardActions` | ダッシュボード操作（銘柄追加・削除・D&D） |
| `useChecklist` | デイリーチェックリスト（CRUD・チェック状態・XP連携） |
| `useDiary` | 投資日記（自動保存・日付ナビゲーション・XP連携） |
| `useFavoriteGroups` | お気に入りグループ（楽観的更新・差分同期） |
| `useExternalLinks` | 外部リンク設定（モジュールキャッシュ・デフォルトフォールバック） |
| `useStockLinkSettings` | 銘柄カード外部リンク表示設定（モジュールキャッシュ・CustomEvent同期） |

### `hooks/auth/` — 認証・グローバル
| フック | 説明 |
|--------|------|
| `useAuth` | Supabase認証状態管理 |
| `useCash` | 投資余力現金・Next Actionメモ（300msデバウンス） |
| `useSound` | サウンド設定 |
| `useSoundOnChange` | 値変更時のサウンド再生 |
| `useGamification` | ゲーミフィケーション状態管理（XPイベントリスニング） |
| `useTitles` | 称号コレクション状態管理（獲得検知・トースト連動） |

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

## 型定義ファイル一覧（16ファイル）

型定義のみ。計算ロジック・フォーマット関数は `src/lib/*Calc.ts` に分離済み。

| ファイル | 内容 |
|---------|------|
| `stock.ts` | StockData（銘柄データ統合型） |
| `positions.ts` | Position, PositionSummary（totalCost, positionCount等） |
| `realizedTrade.ts` | RealizedTrade, SellPositionInput, RealizedTradeResult, RealizedTradeSummary（確定損益） |
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
| `gamification.ts` | GamificationState, XpGrantResult, XpActionType, XpActivityLogEntry |
| `titles.ts` | TitleDefinition, TitleStatus, TitlesResponse, TitleCheckData, TitleCategory, TitleRarity |

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
- `StockCardHeader.tsx`, `StockInput.tsx`, `SearchBar.tsx`, `StockMiniChart.tsx`（チャートから過去株価のインライン修正可・購入▲/売却▼マーカー表示）, `EarningsBadge.tsx`
- `FloatingAddButton.tsx`, `SimplePortfolioSummary.tsx`

### `components/stock-tabs/` — 銘柄カードタブ
- `BasicTab.tsx`, `InvestmentStrategyTab.tsx`, `ManagementTab.tsx`
- `AnalysisSubTab.tsx`, `NextActionSubTab.tsx`
- `PositionsManagement.tsx`, `EventManagement.tsx`, `DividendManagement.tsx`, `ShareholderBenefitManagement.tsx`

### `components/portfolio/` — ポートフォリオ
- `PortfolioSummary.tsx`, `PortfolioOverviewGrid.tsx`, `InvestmentPieChart.tsx`
- `CashPositionSection.tsx`, `TargetSummarySection.tsx`
- `PortfolioHistory.tsx`, `PortfolioChart.tsx`, `ChartMemoModal.tsx`, `chart/ChartSnapshotEditor.tsx`（過去株価のインライン修正）

### `components/alert/` — アラート
- `AlertDisplay.tsx`, `AlertSummaryPage.tsx`

### `components/calendar/` — カレンダー
- `InvestmentCalendar.tsx`, `InvestmentTimeline.tsx`, `MonthlyCalendar.tsx`, `TodayTomorrowEvents.tsx`
- `EarningsCountdown.tsx` — 決算カウントダウンウィジェット（30日以内・ネオン演出）
- `RightsDateCountdown.tsx` — 権利確定日カウントダウン一覧（権利付き最終日併記）
- `MonthlyDividendChart.tsx` — 月別配当受取カレンダー（CSS棒グラフ）
- `DividendYieldRanking.tsx` — 配当利回りランキング

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
| `snapshotCalc.ts` | ポートフォリオスナップショット計算（buildSnapshotData, recalcSnapshotAggregates=保存済み行からの再集計, computeStockSnapshotValue, RANGE_DAYS） |
| `stockMiniChartCalc.ts` | 個別銘柄ミニチャート計算（YAxis domain計算・日付フォーマット・データ変換） |
| `dividendBenefitCalc.ts` | 配当・優待一覧計算（データ処理・フィルタ・ソート・サマリー） |
| `portfolioSummaryCalc.ts` | ポートフォリオサマリー計算（投資額・損益・配当・優待・現金比率） |
| `dateFormat.ts` | 日付フォーマット共通関数（ISO形式・M/D形式） |

## ユーティリティ（src/utils/）

| ファイル | 説明 |
|---------|------|
| `alertSystem.ts` | 6段階アラート計算ロジック |
| `timelineUtils.ts` | タイムライン表示ヘルパー（イベントスタイル・営業日計算等） |
