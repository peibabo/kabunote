-- 古いCamelCaseテーブルを削除（順序重要：外部キー制約に注意）

-- 1. 古いテーブルを削除
DROP TABLE IF EXISTS "StockTabState";
DROP TABLE IF EXISTS "StockTag";
DROP TABLE IF EXISTS "NextActionPlan";
DROP TABLE IF EXISTS "StockBenefit";
DROP TABLE IF EXISTS "StockDividend";
DROP TABLE IF EXISTS "StockEvent";
DROP TABLE IF EXISTS "StockPosition";
DROP TABLE IF EXISTS "StockMemo";
DROP TABLE IF EXISTS "StockPrice";
DROP TABLE IF EXISTS "SnoozedAlert";
DROP TABLE IF EXISTS "FavoriteGroup";
DROP TABLE IF EXISTS "Stock";

-- 2. usersテーブルに不足している列を追加（もしなければ）
ALTER TABLE users ADD COLUMN IF NOT EXISTS cash_amount DECIMAL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS next_action_memo TEXT;

-- 3. 正しいスキーマを確認
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;