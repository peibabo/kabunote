-- public.usersテーブルとauth.usersテーブルの競合を解決

-- Step 1: 現在のpublic.usersテーブルを削除（auth.usersと競合するため）
DROP TABLE IF EXISTS public.users CASCADE;

-- Step 2: 新しいapp_usersテーブルを作成（auth.usersとは別の名前で）
CREATE TABLE app_users (
  id TEXT PRIMARY KEY, -- auth.usersのidを参照
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cash_amount DECIMAL DEFAULT 0,
  next_action_memo TEXT
);

-- Step 3: あなたのユーザーデータを挿入
INSERT INTO app_users (id, email, name, auth_provider, cash_amount, next_action_memo, created_at, updated_at)
VALUES (
  '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5',
  'yuhei.awano@lib-lab.net',
  '阿波野雄平',
  'google',
  450000,
  'この現金は何に使うか考え中（UFJ45万円）',
  NOW(),
  NOW()
);

-- Step 4: 外部キー制約を新しいテーブル名に更新
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_userId_fkey;
ALTER TABLE stocks DROP CONSTRAINT IF EXISTS stocks_user_id_fkey;
ALTER TABLE stocks ADD CONSTRAINT stocks_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE favorite_groups DROP CONSTRAINT IF EXISTS favorite_groups_userId_fkey;
ALTER TABLE favorite_groups DROP CONSTRAINT IF EXISTS favorite_groups_user_id_fkey;
ALTER TABLE favorite_groups ADD CONSTRAINT favorite_groups_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

ALTER TABLE snoozed_alerts DROP CONSTRAINT IF EXISTS snoozed_alerts_userId_fkey;
ALTER TABLE snoozed_alerts DROP CONSTRAINT IF EXISTS snoozed_alerts_user_id_fkey;
ALTER TABLE snoozed_alerts ADD CONSTRAINT snoozed_alerts_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE;

-- 確認
SELECT 'ユーザー作成完了!' as status, id, email, cash_amount, next_action_memo
FROM app_users
WHERE id = '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5';