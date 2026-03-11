# Kabunote - アーキテクチャリファレンス

## データベーススキーマ（15テーブル）

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
  └── feedbacks (フィードバック・目安箱)
        id, user_id, category(ENUM), content, created_at
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

### フィードバック
| パス | メソッド | 説明 |
|------|---------|------|
| `/api/feedback` | POST | フィードバック（目安箱）送信 |

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

## カスタムフック一覧（28フック）

### データ管理（DB CRUD）
| フック | 説明 |
|--------|------|
| `useStockMemo` | 株ノオト（デバウンス自動保存） |
| `useStockPrice` | 株価データ（現在株価・利確目標・損切り）300msデバウンス |
| `useStockPosition` | 複数ポジションCRUD（追加・編集・削除） |
| `useStockEvent` | 決算日・株主総会日（500msデバウンス） |
| `useStockDividend` | 配当情報（500msデバウンス） |
| `useStockBenefit` | 株主優待情報（500msデバウンス） |
| `useStockTag` | タグ管理（楽観的更新） |
| `useNextActionPlan` | 次の一手戦略 |
| `useFavoriteGroups` | お気に入りグループ（楽観的更新・差分同期） |
| `useCash` | 投資余力現金・Next Actionメモ（300msデバウンス） |
| `useSnooze` | アラートスヌーズ管理 |

### UI状態管理
| フック | 説明 |
|--------|------|
| `useTabState` | メインタブ状態 |
| `useInvestmentTabState` | 投資戦略サブタブ状態 |
| `useManagementTabState` | 管理サブタブ状態 |
| `useModals` | モーダル表示状態 |
| `useLocalStorage` | localStorage汎用ラッパー |

### データ取得・集約
| フック | 説明 |
|--------|------|
| `useStockData` | 銘柄データ一括取得（stocks/list API） |
| `usePortfolioData` | ポートフォリオ集計データ |
| `useCalendarData` | カレンダー用イベントデータ |
| `useDividendBenefitData` | 配当・優待一覧データ |
| `useStockSearch` | 銘柄検索（オートコンプリート） |
| `useStockAlerts` | アラート計算・カードスタイル |
| `useAlertCounts` | ヘッダー用アラート集計 |

### ユーティリティ
| フック | 説明 |
|--------|------|
| `useAuth` | Supabase認証状態管理 |
| `useDebounce` | デバウンス汎用 |
| `useAutoSave` | 自動保存ロジック |
| `useAsyncState` | 非同期状態管理 |

---

## 型定義ファイル一覧（11ファイル）

| ファイル | 内容 |
|---------|------|
| `positions.ts` | Position, PositionSummary（totalCost, positionCount等） |
| `tags.ts` | CustomTag, プリセットタグ定義 |
| `favorites.ts` | FavoriteGroup, お気に入りグループ |
| `dividend.ts` | DividendSettings, DividendCalcResult |
| `shareholder.ts` | ShareholderBenefitSettings |
| `rightsDate.ts` | RightsDateSettings（権利確定日共通型） |
| `nextActionPlan.ts` | NextActionPlan, AlertInfo |
| `investmentTabs.ts` | InvestmentTabType |
| `managementTabs.ts` | ManagementTabType |
| `investmentCalendar.ts` | CalendarEvent, TimelineEvent |
| `snooze.ts` | SnoozedAlertInfo, SnoozeOption |

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

## 主要コンポーネント構成

### メインページ
- `page.tsx`: ランディングページ（LP、Server Component）
- `dashboard/page.tsx`: メインダッシュボード（D&D・銘柄一覧・カレンダー・ポートフォリオサマリー）

### カード系
- `StockCard.tsx`: 銘柄カード（タブ制御・統合アラート・スマートナビゲーション）
- `StockCardHeader.tsx`: カードヘッダー（銘柄名・コード・アラートアイコン）

### タブコンテンツ
- `InvestmentStrategyTab.tsx`: 投資戦略タブ（サブタブコンテナ）
- `AnalysisSubTab.tsx`: 分析サブタブ（投資規律・株価ポジション・損益シミュレーション）
- `NextActionSubTab.tsx`: 次の一手サブタブ
- `ManagementTab.tsx`: 管理タブ（サブタブコンテナ）
- `PositionsManagement.tsx`: 保有状況管理（複数ロットCRUD）
- `EventManagement.tsx`: 決算発表日・株主総会日管理
- `DividendManagement.tsx`: 配当管理
- `ShareholderBenefitManagement.tsx`: 株主優待管理

### ダッシュボード系
- `SimplePortfolioSummary.tsx`: ポートフォリオサマリー
- `InvestmentPieChart.tsx`: 円グラフ分析
- `StrategySummaryPage.tsx`: 戦略一覧ダッシュボード
- `AlertSummaryPage.tsx`: アラート一覧
- `DividendBenefitListPage.tsx`: 配当・優待一覧ダッシュボード
- `PositionListPage.tsx`: 保有ポジション一覧

### カレンダー系
- `InvestmentCalendar.tsx`: 投資カレンダー
- `InvestmentTimeline.tsx`: 投資タイムライン
- `TodayTomorrowEvents.tsx`: 今日・明日の予定表示

### 設定系
- `SoundSettings.tsx`: サウンドフィードバック設定（ON/OFF・音量・試聴）

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

## ユーティリティ（src/utils/）

| ファイル | 説明 |
|---------|------|
| `alertSystem.ts` | 6段階アラート計算ロジック |
| `timelineUtils.ts` | タイムライン表示ヘルパー（イベントスタイル・営業日計算等） |
