-- Kabunote Database Schema for Supabase
-- 投資思考整理ダッシュボードのためのデータベーススキーマ

-- ユーザー管理
CREATE TABLE IF NOT EXISTS "users" (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  auth_provider TEXT NOT NULL, -- "google", "email"
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  cash_amount DECIMAL,
  next_action_memo TEXT
);

-- 銘柄基本情報
CREATE TABLE IF NOT EXISTS "stocks" (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  sector TEXT,
  market TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 株価情報
CREATE TABLE IF NOT EXISTS stock_prices (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  current_price DECIMAL,
  target_price DECIMAL,
  stop_loss_price DECIMAL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 銘柄メモ
CREATE TABLE IF NOT EXISTS stock_memos (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- タグ
CREATE TABLE IF NOT EXISTS stock_tags (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray'
);

-- 保有ポジション
CREATE TABLE IF NOT EXISTS stock_positions (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  shares INTEGER NOT NULL,
  average_price DECIMAL,
  total_investment DECIMAL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- イベント
CREATE TABLE IF NOT EXISTS stock_events (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'EARNINGS', 'DIVIDEND', 'SHAREHOLDER_MEETING'
  event_date DATE NOT NULL
);

-- 配当情報
CREATE TABLE IF NOT EXISTS stock_dividends (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  dividend_per_share DECIMAL,
  frequency INTEGER DEFAULT 1,
  rights_month INTEGER,
  rights_day INTEGER
);

-- 株主優待情報
CREATE TABLE IF NOT EXISTS stock_benefits (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  description TEXT,
  minimum_shares INTEGER,
  estimated_value DECIMAL,
  rights_month INTEGER,
  rights_day INTEGER
);

-- Next Action Plan
CREATE TABLE IF NOT EXISTS next_action_plans (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'HOLD', -- 'BUY', 'SELL', 'HOLD', 'WATCH'
  priority TEXT NOT NULL DEFAULT 'MEDIUM', -- 'HIGH', 'MEDIUM', 'LOW'
  target_price DECIMAL,
  target_shares INTEGER,
  strategy_memo TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- お気に入りグループ
CREATE TABLE IF NOT EXISTS favorite_groups (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- スヌーズアラート
CREATE TABLE IF NOT EXISTS snoozed_alerts (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "users"(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  snooze_until TIMESTAMP NOT NULL
);

-- タブ状態
CREATE TABLE IF NOT EXISTS stock_tab_states (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER NOT NULL REFERENCES "stocks"(id) ON DELETE CASCADE,
  tab_type TEXT NOT NULL, -- 'active', 'management', 'investment_strategy'
  current_tab TEXT NOT NULL
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS "Stock_userId_idx" ON "stocks"(user_id);
CREATE INDEX IF NOT EXISTS "StockPrice_stockId_idx" ON stock_prices(stock_id);
CREATE INDEX IF NOT EXISTS "StockMemo_stockId_idx" ON stock_memos(stock_id);
CREATE INDEX IF NOT EXISTS "StockTag_stockId_idx" ON stock_tags(stock_id);
CREATE INDEX IF NOT EXISTS "StockPosition_stockId_idx" ON stock_positions(stock_id);
CREATE INDEX IF NOT EXISTS "StockEvent_stockId_idx" ON stock_events(stock_id);
CREATE INDEX IF NOT EXISTS "StockDividend_stockId_idx" ON stock_dividends(stock_id);
CREATE INDEX IF NOT EXISTS "StockBenefit_stockId_idx" ON stock_benefits(stock_id);
CREATE INDEX IF NOT EXISTS "NextActionPlan_stockId_idx" ON next_action_plans(stock_id);
CREATE INDEX IF NOT EXISTS "FavoriteGroup_userId_idx" ON favorite_groups(user_id);
CREATE INDEX IF NOT EXISTS "SnoozedAlert_userId_idx" ON snoozed_alerts(user_id);
CREATE INDEX IF NOT EXISTS "StockTabState_stockId_idx" ON stock_tab_states(stock_id);