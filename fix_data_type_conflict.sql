-- データ型競合を解決（UUID vs TEXT）

-- Step 1: 既存テーブルを全て削除してクリーンアップ
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS stock_tab_states CASCADE;
DROP TABLE IF EXISTS stock_tags CASCADE;
DROP TABLE IF EXISTS next_action_plans CASCADE;
DROP TABLE IF EXISTS stock_benefits CASCADE;
DROP TABLE IF EXISTS stock_dividends CASCADE;
DROP TABLE IF EXISTS stock_events CASCADE;
DROP TABLE IF EXISTS stock_positions CASCADE;
DROP TABLE IF EXISTS stock_memos CASCADE;
DROP TABLE IF EXISTS stock_prices CASCADE;
DROP TABLE IF EXISTS snoozed_alerts CASCADE;
DROP TABLE IF EXISTS favorite_groups CASCADE;
DROP TABLE IF EXISTS stocks CASCADE;

-- Step 2: UUIDに統一したapp_usersテーブルを作成
CREATE TABLE app_users (
  id UUID PRIMARY KEY, -- auth.usersのUUIDと同じ型
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cash_amount DECIMAL DEFAULT 0,
  next_action_memo TEXT
);

-- Step 3: あなたのユーザーデータを挿入（UUID型で）
INSERT INTO app_users (id, email, name, auth_provider, cash_amount, next_action_memo, created_at, updated_at)
VALUES (
  '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, -- UUID型にキャスト
  'yuhei.awano@lib-lab.net',
  '阿波野雄平',
  'google',
  450000,
  'この現金は何に使うか考え中（UFJ45万円）',
  NOW(),
  NOW()
);

-- Step 4: 銘柄テーブル（UUID型で外部キー）
CREATE TABLE stocks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- UUID型
  symbol TEXT NOT NULL,
  name TEXT,
  sector TEXT,
  market TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- Step 5: 関連テーブルを順次作成
CREATE TABLE stock_prices (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  current_price DECIMAL,
  target_price DECIMAL,
  stop_loss_price DECIMAL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_memos (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_positions (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  shares INTEGER NOT NULL DEFAULT 0,
  average_price DECIMAL,
  total_investment DECIMAL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_events (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'EARNINGS', 'SHAREHOLDER_MEETING'
  event_date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_dividends (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  dividend_per_share DECIMAL,
  frequency INTEGER DEFAULT 1,
  rights_month INTEGER,
  rights_day INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_benefits (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  description TEXT,
  minimum_shares INTEGER,
  estimated_value DECIMAL,
  rights_month INTEGER,
  rights_day INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_tags (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, name)
);

CREATE TABLE next_action_plans (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'HOLD', -- 'BUY', 'SELL', 'HOLD'
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
  target_price DECIMAL,
  target_shares INTEGER,
  strategy_memo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE favorite_groups (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- UUID型
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

CREATE TABLE snoozed_alerts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, -- UUID型
  stock_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  snooze_until TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE stock_tab_states (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  tab_type TEXT NOT NULL, -- 'active', 'management', 'investment_strategy'
  current_tab TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, tab_type)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS stocks_user_id_idx ON stocks(user_id);
CREATE INDEX IF NOT EXISTS stock_prices_stock_id_idx ON stock_prices(stock_id);
CREATE INDEX IF NOT EXISTS stock_memos_stock_id_idx ON stock_memos(stock_id);
CREATE INDEX IF NOT EXISTS stock_tags_stock_id_idx ON stock_tags(stock_id);
CREATE INDEX IF NOT EXISTS stock_positions_stock_id_idx ON stock_positions(stock_id);
CREATE INDEX IF NOT EXISTS stock_events_stock_id_idx ON stock_events(stock_id);
CREATE INDEX IF NOT EXISTS stock_dividends_stock_id_idx ON stock_dividends(stock_id);
CREATE INDEX IF NOT EXISTS stock_benefits_stock_id_idx ON stock_benefits(stock_id);
CREATE INDEX IF NOT EXISTS next_action_plans_stock_id_idx ON next_action_plans(stock_id);
CREATE INDEX IF NOT EXISTS favorite_groups_user_id_idx ON favorite_groups(user_id);
CREATE INDEX IF NOT EXISTS snoozed_alerts_user_id_idx ON snoozed_alerts(user_id);
CREATE INDEX IF NOT EXISTS stock_tab_states_stock_id_idx ON stock_tab_states(stock_id);

-- 確認
SELECT 'スキーマ作成完了!' as status, id, email, cash_amount
FROM app_users
WHERE id = '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid;