# 📋 株式ポジションテーブル マイグレーション手順

## 🚀 実行前の準備

1. **Supabaseダッシュボード**にログイン
2. **SQL Editor**を開く
3. 以下の手順を**順番通り**に実行してください

---

## 📊 STEP 1: 現在の状況確認

```sql
-- 現在のテーブル構造とデータを確認
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'stock_positions'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 既存データの件数確認
SELECT COUNT(*) as total_records FROM public.stock_positions;

-- 既存データのサンプル確認
SELECT * FROM public.stock_positions LIMIT 3;
```

**✅ 確認ポイント**: 現在のフィールド名とデータ件数をメモしてください

---

## 🛡️ STEP 2: データバックアップ

```sql
-- バックアップテーブル作成
DROP TABLE IF EXISTS public.stock_positions_backup CASCADE;

CREATE TABLE public.stock_positions_backup AS
SELECT * FROM public.stock_positions;

-- バックアップ確認
SELECT
    'バックアップ完了' as status,
    COUNT(*) as backup_count
FROM public.stock_positions_backup;
```

**✅ 確認ポイント**: バックアップ件数が元の件数と一致することを確認

---

## 🏗️ STEP 3: 新テーブル作成

```sql
-- 既存テーブル削除
DROP TABLE IF EXISTS public.stock_positions CASCADE;

-- 新構造でテーブル作成
CREATE TABLE public.stock_positions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    stock_id TEXT UNIQUE NOT NULL,
    shares_owned INTEGER DEFAULT 0 NOT NULL,
    average_purchase_price DECIMAL,
    current_price DECIMAL,
    profit_target DECIMAL,
    loss_limit DECIMAL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

    CONSTRAINT stock_positions_stock_id_fkey
    FOREIGN KEY (stock_id) REFERENCES public.stocks (id) ON DELETE CASCADE
);

-- インデックス作成
CREATE INDEX idx_stock_positions_stock_id ON public.stock_positions (stock_id);
```

**✅ 確認ポイント**: エラーなく実行されることを確認

---

## ⚡ STEP 4: トリガー設定

```sql
-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー適用
CREATE TRIGGER update_stock_positions_updated_at
    BEFORE UPDATE ON public.stock_positions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

---

## 🔒 STEP 5: RLSポリシー設定

```sql
-- RLS有効化
ALTER TABLE public.stock_positions ENABLE ROW LEVEL SECURITY;

-- ユーザーアクセスポリシー
CREATE POLICY "Users can manage their own stock positions"
ON public.stock_positions
FOR ALL
USING (
    stock_id IN (
        SELECT s.id
        FROM public.stocks s
        WHERE s.user_id = auth.uid()::text
    )
)
WITH CHECK (
    stock_id IN (
        SELECT s.id
        FROM public.stocks s
        WHERE s.user_id = auth.uid()::text
    )
);
```

---

## 📥 STEP 6: データ復元

```sql
-- バックアップデータから復元
INSERT INTO public.stock_positions (
    stock_id,
    shares_owned,
    average_purchase_price,
    current_price,
    profit_target,
    loss_limit,
    created_at,
    updated_at
)
SELECT
    stock_id,
    COALESCE(shares, 0) as shares_owned,
    average_price as average_purchase_price,
    COALESCE(
        (SELECT current_price FROM public.stock_prices p WHERE p.stock_id = b.stock_id),
        NULL
    ) as current_price,
    COALESCE(
        (SELECT target_price FROM public.stock_prices p WHERE p.stock_id = b.stock_id),
        NULL
    ) as profit_target,
    COALESCE(
        (SELECT stop_loss_price FROM public.stock_prices p WHERE p.stock_id = b.stock_id),
        NULL
    ) as loss_limit,
    COALESCE(created_at, now()) as created_at,
    COALESCE(updated_at, now()) as updated_at
FROM public.stock_positions_backup b
WHERE stock_id IS NOT NULL
ON CONFLICT (stock_id) DO UPDATE SET
    shares_owned = EXCLUDED.shares_owned,
    average_purchase_price = EXCLUDED.average_purchase_price,
    current_price = EXCLUDED.current_price,
    profit_target = EXCLUDED.profit_target,
    loss_limit = EXCLUDED.loss_limit,
    updated_at = now();
```

---

## ✅ STEP 7: マイグレーション結果確認

```sql
-- 復元結果確認
SELECT
    'マイグレーション完了' as status,
    COUNT(*) as total_records,
    COUNT(CASE WHEN shares_owned > 0 THEN 1 END) as records_with_shares,
    COUNT(CASE WHEN average_purchase_price IS NOT NULL THEN 1 END) as records_with_price
FROM public.stock_positions;

-- 新旧データ比較
SELECT
    'バックアップ' as source,
    COUNT(*) as count
FROM public.stock_positions_backup

UNION ALL

SELECT
    '新テーブル' as source,
    COUNT(*) as count
FROM public.stock_positions;
```

**✅ 確認ポイント**: レコード数が一致することを確認

---

## 🧹 STEP 8: クリーンアップ（確認後実行）

```sql
-- バックアップテーブル削除（成功確認後）
-- ⚠️ 動作確認完了後に実行してください
-- DROP TABLE IF EXISTS public.stock_positions_backup;
```

---

## 🎉 完了

マイグレーションが完了しました！アプリケーションでポジション管理をテストしてください。