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

DB保存後にカレンダーをリアルタイム更新するカスタムイベント:

```typescript
// 保存後にイベント発火（フック内で実行）
window.dispatchEvent(new CustomEvent('kabunote-db-calendar-update'));

// page.tsx で購読
useEffect(() => {
  const handler = () => refreshData();
  window.addEventListener('kabunote-db-calendar-update', handler);
  return () => window.removeEventListener('kabunote-db-calendar-update', handler);
}, []);
```

対象フック: `useStockEvent`, `useStockDividend`, `useStockBenefit`

---

## localStorage キー管理

- **管理ファイル**: `src/lib/storageKeys.ts`
- **用途**: UI状態のみ（データは全てDB管理）
- **グローバルキー**: `STORAGE_KEYS.SELECTED_GROUP_FILTER`, `STORAGE_KEYS.SNOOZED_ALERTS`, `STORAGE_KEYS.TIMELINE_CALENDAR_EXPANDED`
- **銘柄固有キー**: `stockKey.activeTab(symbol)`, `stockKey.openTab(symbol)`, `stockKey.investmentTab(symbol)`, `stockKey.managementTab(symbol)`

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
