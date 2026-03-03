-- stock_events テーブルの拡張マイグレーション
-- Supabase Dashboard > SQL Editor で実行してください

-- 1. event_date を nullable に変更（株主総会は月/日設定のみ使用するため）
ALTER TABLE stock_events ALTER COLUMN event_date DROP NOT NULL;

-- 2. event_month カラム追加（株主総会の月 1-12）
ALTER TABLE stock_events ADD COLUMN IF NOT EXISTS event_month INTEGER;

-- 3. event_day カラム追加（株主総会の日 1-31）
ALTER TABLE stock_events ADD COLUMN IF NOT EXISTS event_day INTEGER;

-- 4. is_recurring カラム追加（毎年繰り返し、デフォルト false）
ALTER TABLE stock_events ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

-- 5. is_active カラム追加（有効/無効、デフォルト true）
ALTER TABLE stock_events ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- 6. stockId + eventType のユニーク制約追加（1銘柄につき各イベント1件）
ALTER TABLE stock_events ADD CONSTRAINT stock_events_stock_id_event_type_key UNIQUE (stock_id, event_type);

-- 確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'stock_events'
ORDER BY ordinal_position;
