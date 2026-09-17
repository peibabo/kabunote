# Kabunote - 実装パターン集

新機能追加時に参照する標準パターンをまとめたドキュメント。

---

## resolveStockId() パターン

`stock-SYMBOL` 形式のフロントエンド用IDをDB UUIDに変換する共通関数。

```typescript
import { resolveStockId } from '@/lib/resolveStockId';

// 基本使用法（既存銘柄のみ）
const stockId = await resolveStockId(id, userId);

// 銘柄が存在しなければ作成（memo/route.ts のみ使用）
const stockId = await resolveStockId(id, userId, true);
```

- 全APIルートで使用必須
- `memo/route.ts` のみ第3引数 `createIfNotFound = true`（lazy登録）
- 他のルートはデフォルト（`false`）

---

## DBフック作成パターン（useStock* テンプレート）

新しいDB連携フックを作る際の標準パターン：

```typescript
'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';

export function useStockXxx(symbol: string) {
  const { session } = useAuth();
  const [data, setData] = useState<XxxType>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const stockId = `stock-${symbol}`;

  // DB からロード
  useEffect(() => {
    if (!session) return;
    const load = async () => {
      try {
        const res = await fetch(`/api/stocks/${stockId}/xxx`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [session, stockId]);

  // デバウンス付き自動保存（500ms）
  const update = useCallback((newData: Partial<XxxType>) => {
    setData(prev => ({ ...prev, ...newData })); // 即時UI更新
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      await fetch(`/api/stocks/${stockId}/xxx`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newData),
      });
    }, 500);
  }, [stockId]);

  return { data, isLoading, update };
}
```

### ポイント
- **即時UI更新 + デバウンスDB保存**: `setState` で即座にUI反映、タイマーでDB保存
- **デバウンス時間**: 入力系は300-500ms
- **楽観的更新**（タグ等の追加/削除系）: tempIdで即時反映 → DB保存後に差し替え、失敗時ロールバック

---

## APIルート作成パターン

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabase-server';
import { resolveStockId } from '@/lib/resolveStockId';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stockId: string }> }
) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { stockId: rawStockId } = await params;
  const userId = session.user.id;
  const stockId = await resolveStockId(rawStockId, userId);
  if (!stockId) return NextResponse.json({ error: 'Stock not found' }, { status: 404 });

  const data = await prisma.xxxModel.findUnique({ where: { stockId } });
  return NextResponse.json(data);
}
```

---

## APIレート制限パターン

全APIルートは `withAuth()` / `withStock()` 経由でインメモリのスライディングウィンドウ方式レート制限が自動適用される。

### デフォルト制限
- **一般API**: 1分間に60リクエスト（ユーザーID単位）

### カスタム制限の適用
```typescript
import { withAuth } from '@/lib/apiHandler'
import { FEEDBACK_LIMIT } from '@/lib/rateLimit'

// 第3引数のoptionsでカスタムレート制限を指定
export const POST = withAuth(async ({ user, request }) => {
  // ...
}, 'フィードバックの送信', { rateLimit: FEEDBACK_LIMIT })
```

### プリセット設定（`src/lib/rateLimit.ts`）
| プリセット | 制限 | 用途 |
|-----------|------|------|
| デフォルト | 60回/分 | 一般API |
| `WRITE_LIMIT` | 30回/分 | 書き込み系API |
| `AUTH_LIMIT` | 10回/分 | 認証・アカウント系（sync-user, account/delete） |
| `FEEDBACK_LIMIT` | 5回/時 | フィードバック送信 |

### レスポンスヘッダー
すべてのAPIレスポンスに以下のヘッダーが付与される：
- `X-RateLimit-Limit`: ウィンドウ内の最大リクエスト数
- `X-RateLimit-Remaining`: 残りリクエスト数
- `X-RateLimit-Reset`: リセットまでの秒数

制限超過時は `429 Too Many Requests` + `Retry-After` ヘッダーを返却。

### テスト時の注意
APIテストの `beforeEach` で `resetRateLimitStore()` を呼び出すこと（テスト間でレート制限状態が共有されるため）。

---

## RLSポリシー設定

`prisma db push --force-reset` 後はRLSポリシー再設定が必要。Supabase Dashboard > SQL Editor で以下を実行する。

### パターン1: user_id 直接参照（app_users, stocks, favorite_groups, snoozed_alerts）

```sql
-- app_users（idで制御）
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.app_users;
CREATE POLICY "Users can manage their own profile"
ON public.app_users FOR ALL
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- stocks
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stocks" ON public.stocks;
CREATE POLICY "Users can manage their own stocks"
ON public.stocks FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- favorite_groups
ALTER TABLE public.favorite_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own favorite groups" ON public.favorite_groups;
CREATE POLICY "Users can manage their own favorite groups"
ON public.favorite_groups FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- snoozed_alerts
ALTER TABLE public.snoozed_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own snoozed alerts" ON public.snoozed_alerts;
CREATE POLICY "Users can manage their own snoozed alerts"
ON public.snoozed_alerts FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);
```

### パターン2: stock_id 経由チェーン（stock_id → stocks.user_id）

対象テーブル: stock_memos, stock_prices, stock_positions, stock_events, stock_dividends, stock_benefits, stock_tags, next_action_plans, stock_tab_states

```sql
-- stock_memos（他テーブルも同パターン。テーブル名・ポリシー名を置換）
ALTER TABLE public.stock_memos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock memos" ON public.stock_memos;
CREATE POLICY "Users can manage their own stock memos"
ON public.stock_memos FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));
```

### 確認クエリ

```sql
SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
```

### 注意
- `app_users.id` は `user_id` ではなく `id` でアクセス制御
- RLSポリシーは Supabase Dashboard > SQL Editor で実行
- `prisma db push --force-reset` 後はRLSポリシー再設定が必要
- stock_favorite_groups テーブルは中間テーブルのため、stocks側のRLSで保護される

---

## カレンダー連動パターン

DB保存後にカレンダーをリアルタイム更新する（詳細は後述の「アプリ内イベント」を参照）:

```typescript
// 保存後にイベント発火（フック内で実行）。detail の type で更新種別を切り替える
emitAppEvent(APP_EVENTS.DB_CALENDAR_UPDATE, { type: 'dividend', symbol, dividend });

// useCalendarData で購読
useAppEvent(APP_EVENTS.DB_CALENDAR_UPDATE, (detail) => {
  if (detail.type === 'dividend') updateStockData(detail.symbol, { dividend: detail.dividend });
}, { enabled: isInitialized });
```

対象フック: `useStockEvent`, `useStockDividend`, `useStockBenefit`

---

## localStorage キー管理

- **管理ファイル**: `src/lib/storageKeys.ts`
- **用途**: UI状態のみ（データは全てDB管理）
- **グローバルキー**: `STORAGE_KEYS.SELECTED_GROUP_FILTER`, `STORAGE_KEYS.SNOOZED_ALERTS`, `STORAGE_KEYS.TIMELINE_CALENDAR_EXPANDED`
- **銘柄固有キー**: `stockKey.activeTab(symbol)`, `stockKey.openTab(symbol)`, `stockKey.investmentTab(symbol)`, `stockKey.managementTab(symbol)`
- **チャート期間の記憶**: 推移グラフ（`PORTFOLIO_HISTORY_RANGE`）・銘柄ミニチャート（`STOCK_MINI_CHART_RANGE`、全銘柄共通）の選択中期間を `useLocalStorage` で永続化。`parseHistoryRange()`（`src/types/portfolio.ts`）で不正値をデフォルトにフォールバックし、`rangeLoading` フラグでフェッチをゲートして初回ロード時の二重フェッチを防ぐ

---

## アプリ内イベント（コンポーネント間の再描画通知）

DB更新をまたいだ再描画は `window` のカスタムイベントで伝える。**イベント名と detail の型は `src/lib/appEvents.ts` に集約**（`storageKeys.ts` の姉妹ファイル）。

生の文字列で `dispatchEvent` すると typo がサイレントに無視される（リスナーが反応しないだけでエラーにならない）ため、必ず定数を経由すること。

### 発火

```ts
import { emitAppEvent, APP_EVENTS } from '@/lib/appEvents'

emitAppEvent(APP_EVENTS.DB_TAG_UPDATE, { symbol, tags })
emitAppEvent(APP_EVENTS.SNAPSHOT_CREATED)  // detailなしのイベントは第2引数を省略
```

`emitAppEvent` はSSRガード込み。detail の型は `AppEventDetailMap` で縛られるため、送信側と受信側の食い違いがコンパイルエラーになる。

### 購読

```ts
import { useAppEvent } from '@/hooks/util/useAppEvent'

useAppEvent(APP_EVENTS.DB_TAG_UPDATE, (detail) => {
  updateStockData(detail.symbol, { tags: detail.tags })
})

// 初期化前は購読しない場合
useAppEvent(APP_EVENTS.DB_PRICE_UPDATE, handler, { enabled: isInitialized })
```

- handler は ref に保持されるため、毎レンダリングで新しい関数を渡してもリスナーは再登録されない（呼び出し側で `useCallback` 不要）
- **リスナー専用の `useEffect` は `useAppEvent` に置き換える。** タイマーのクリーンアップや fetch ロジックと同居している `useEffect`（`usePortfolioHistory` / `useTradeMarkers`）は、そのまま `APP_EVENTS` 定数だけを使う

### イベントを追加するとき

1. `APP_EVENTS` に定数を追加（コメントで用途を書く）
2. `AppEventDetailMap` に detail の型を追加（detailなしは `void`）
3. 発火側は `emitAppEvent`、購読側は `useAppEvent`

---

## キャッシュ共有型の設定フック

外部リンク設定・銘柄リンク設定のように「ユーザーごとに1件、複数コンポーネントから同時に読まれる設定」は `createCachedSettingsHook`（`src/hooks/util/createCachedSettingsHook.ts`）で生成する。

```ts
const useCachedExternalLinks = createCachedSettingsHook({
  endpoint: '/api/external-links',
  bodyKey: 'links',                              // PUT の body は { links: value }
  eventName: APP_EVENTS.EXTERNAL_LINKS_UPDATE,   // detail が設定値そのものであること
  defaultValue: DEFAULT_EXTERNAL_LINKS,          // APIが data: null を返したときの既定値
  saveErrorMessage: '外部リンクの保存に失敗しました',
})

export function useExternalLinks() {
  const { value, isLoading, save } = useCachedExternalLinks()
  return { links: value, isLoading, saveLinks: save }  // ドメイン名に付け替える
}
```

ファクトリが面倒を見る範囲:

- モジュールスコープのキャッシュ + in-flight promise の共有 → **同時マウントでも fetch は1回**
- 初期値はキャッシュ or 既定値（ちらつき防止）
- 保存後にキャッシュ更新 → イベントで他インスタンスへ伝播
- 取得失敗は握りつぶして既定値のまま、保存失敗は toast + 再スロー

注意点:

- 返り値は `value` / `isLoading` / `save` に固定。呼び出し側の薄いラッパーでドメインに合った名前に付け替える
- **キャッシュはファクトリ呼び出しごと**に作られるため、`createCachedSettingsHook(...)` はモジュールトップレベルで1回だけ呼ぶこと（コンポーネント内で呼ぶとキャッシュが共有されない）
- 対象APIは `{ success: true, data }` 封筒を返すこと（`apiClient` の `apiFetch` / `apiPut` を使うため）

## 確定損益フックの共通ベース

`useRealizedTradesBase(endpoint, stockId?)`（`src/hooks/util/useRealizedTradesBase.ts`）が取得と再取得を担う。

| フック | エンドポイント | 再取得の条件 |
|---|---|---|
| `useRealizedTrades(stockId)` | `/api/stocks/{stockId}/position/sell` | detail が無い or `detail.stockId` が一致 |
| `usePortfolioRealizedTrades()` | `/api/portfolio/realized` | すべての `DB_REALIZED_UPDATE` |

削除操作（`deleteTrade`）は引数の形が異なるため各フック側で公開する。

---

## 日付・数値フォーマット

表示用フォーマットは以下に集約する。**コンポーネント内にローカル関数を定義しないこと**（曜日配列やパース方法が分岐し、片方だけ直す事故につながるため）。

### `src/lib/dateFormat.ts` — 日付文字列（YYYY-MM-DD）の表示

| 関数 | 出力例 | 用途 |
|---|---|---|
| `formatMonthDay` | `3/8` | 一覧の日付カラム。空文字は `-` |
| `formatDateLabel` | `3/8` | チャート軸ラベル。`Date` を経由せずTZ非依存 |
| `formatDateYMDJP` | `2026年3月8日` | チャートメモのヘッダー |
| `formatDateJP` | `2026年3月8日（日）` | 投資日記 |
| `formatDateSlashJP` | `2026/3/8（日）` | チャートメモ一覧 |
| `formatMonthDayJP` | `3/8（日）` | ニュース一覧 |
| `getWeekdayJP` / `WEEKDAYS_JP` | `日` | 曜日ラベルの唯一の定義元 |

- 曜日を扱う関数は内部で `new Date(dateStr + 'T00:00:00')`（ローカル解釈）を使う。`new Date('2026-03-08')` はUTC深夜扱いになるため直接使わない
- `formatDateYMDJP` のみ非文字列入力のガードを持つ（Rechartsのペイロード経由でクラッシュした回帰対応）
- `Date` → `YYYY-MM-DD` は `formatDateJST`（`src/lib/dateJst.ts`）。`investmentCalendarCalc.formatDateString` はその別名

### `src/lib/chartFormat.ts` — チャート軸の数値

- `formatYAxisValue`: 1000万以上は `1.0千万`、1万以上は `12万`、それ未満は整数。推移グラフ・銘柄ミニチャート共用

---

## DB接続の注意点

| 接続方式 | ポート | 用途 |
|---------|-------|------|
| Transaction Pooler | 6543 | 通常クエリのみ（DDL不可）。アプリから使用 |
| Session Pooler | 5432 | DDL可能。`prisma db push` 等に使用 |

- `prisma.config.ts` は `.env` の DATABASE_URL を使用
- 本番DBは `.env.local` の DATABASE_URL
- `prisma generate` 後は開発サーバー再起動が必要（node_modules キャッシュ）
- DBマイグレーション手動実行: Supabase Dashboard > SQL Editor
