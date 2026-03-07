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

## RLSポリシーテンプレート

stock_id を持つテーブルの標準RLSパターン（stock_id → stocks.user_id チェーン）:

```sql
ALTER TABLE public.xxx_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own xxx"
ON public.xxx_table FOR ALL
USING (stock_id IN (SELECT s.id FROM stocks s WHERE s.user_id = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT s.id FROM stocks s WHERE s.user_id = auth.uid()::text));
```

### 注意
- `app_users.id` は `user_id` ではなく `id` でアクセス制御
- RLSポリシーは Supabase Dashboard > SQL Editor で実行
- `prisma db push --force-reset` 後はRLSポリシー再設定が必要

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
