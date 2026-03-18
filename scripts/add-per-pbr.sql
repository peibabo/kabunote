-- PER/PBR カラム追加マイグレーション
-- Supabase SQL Editorで実行してください（開発・本番それぞれ）

ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS per DECIMAL;
ALTER TABLE stock_prices ADD COLUMN IF NOT EXISTS pbr DECIMAL;
