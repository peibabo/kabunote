# Kabunote - プロジェクトマイルストーン

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
