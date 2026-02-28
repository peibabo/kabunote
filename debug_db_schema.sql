-- デバッグ用：実際のデータベーススキーマを確認するクエリ
-- Supabaseダッシュボードで実行してください

-- 1. usersテーブルの列構造を確認
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 2. 全テーブル一覧を確認
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. 特定のテーブルが存在するか確認
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'users'
);