-- ============================================
-- Kabunote 開発DB セットアップSQL
-- Supabase SQL Editorで実行してください
-- ============================================
-- prisma/schema.prisma と同期済み（2026-03-18時点）
-- 本番DBと同じテーブル構造・RLS・トリガーを再現します

-- ============================================
-- 1. Enum型の作成
-- ============================================

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM ('EARNINGS', 'SHAREHOLDER_MEETING');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionType" AS ENUM ('BUY', 'SELL', 'HOLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AlertType" AS ENUM (
    'FUND_SHORTAGE',
    'STOP_LOSS_EXCEEDED',
    'NEXT_ACTION_URGENT',
    'STOP_LOSS_APPROACHING',
    'PROFIT_TARGET_APPROACHING',
    'NEXT_ACTION_WARNING'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "FeedbackCategory" AS ENUM ('FEATURE_REQUEST', 'IMPROVEMENT', 'BUG_REPORT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. テーブル作成（21テーブル）
-- ============================================

-- ① app_users（ユーザー管理）
CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  auth_provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cash_amount DECIMAL DEFAULT 0,
  next_action_memo TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE
);

-- ② stocks（銘柄マスター）
CREATE TABLE IF NOT EXISTS stocks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  name TEXT,
  sector TEXT,
  market TEXT,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- ③ stock_memos（銘柄メモ）
CREATE TABLE IF NOT EXISTS stock_memos (
  id TEXT PRIMARY KEY,
  stock_id TEXT UNIQUE NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ④ stock_prices（株価情報）
CREATE TABLE IF NOT EXISTS stock_prices (
  id TEXT PRIMARY KEY,
  stock_id TEXT UNIQUE NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  current_price DECIMAL,
  target_price DECIMAL,
  stop_loss_price DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑤ stock_positions（保有ポジション - 1銘柄に複数レコード）
CREATE TABLE IF NOT EXISTS stock_positions (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  shares INT NOT NULL,
  purchase_price DECIMAL NOT NULL,
  purchase_date TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑥ stock_events（銘柄イベント）
CREATE TABLE IF NOT EXISTS stock_events (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  event_type "EventType" NOT NULL,
  event_date TIMESTAMPTZ,
  event_month INT,
  event_day INT,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, event_type)
);

-- ⑦ stock_dividends（配当情報）
CREATE TABLE IF NOT EXISTS stock_dividends (
  id TEXT PRIMARY KEY,
  stock_id TEXT UNIQUE NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  dividend_per_share DECIMAL,
  frequency INT DEFAULT 1,
  rights_month INT,
  rights_day INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑧ stock_benefits（株主優待情報）
CREATE TABLE IF NOT EXISTS stock_benefits (
  id TEXT PRIMARY KEY,
  stock_id TEXT UNIQUE NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  description TEXT,
  minimum_shares INT,
  estimated_value DECIMAL,
  rights_month INT,
  rights_day INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑨ stock_tags（タグ管理）
CREATE TABLE IF NOT EXISTS stock_tags (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, name)
);

-- ⑩ next_action_plans（次の一手戦略）
CREATE TABLE IF NOT EXISTS next_action_plans (
  id TEXT PRIMARY KEY,
  stock_id TEXT UNIQUE NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  action_type "ActionType" NOT NULL,
  priority "Priority" NOT NULL,
  target_price DECIMAL,
  target_shares INT,
  strategy_memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑪ favorite_groups（お気に入りグループ）
CREATE TABLE IF NOT EXISTS favorite_groups (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- ⑫ stock_favorite_groups（お気に入りグループ-銘柄 中間テーブル）
CREATE TABLE IF NOT EXISTS stock_favorite_groups (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  group_id TEXT NOT NULL REFERENCES favorite_groups(id) ON DELETE CASCADE,
  UNIQUE(stock_id, group_id)
);

-- ⑬ snoozed_alerts（アラートスヌーズ管理）
CREATE TABLE IF NOT EXISTS snoozed_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  alert_type "AlertType" NOT NULL,
  snooze_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑭ stock_tab_states（タブ状態管理）
CREATE TABLE IF NOT EXISTS stock_tab_states (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  tab_type TEXT NOT NULL,
  current_tab TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(stock_id, tab_type)
);

-- ⑮ user_external_links（外部リンク設定）
CREATE TABLE IF NOT EXISTS user_external_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  gradient TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑯ feedbacks（フィードバック・目安箱）
CREATE TABLE IF NOT EXISTS feedbacks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  category "FeedbackCategory" NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ⑰ portfolio_snapshots（ポートフォリオ日次スナップショット）
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_investment DECIMAL NOT NULL,
  total_value DECIMAL NOT NULL,
  profit_loss DECIMAL NOT NULL,
  cash_amount DECIMAL NOT NULL,
  net_assets DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date)
);

-- ⑱ stock_price_snapshots（銘柄別日次株価スナップショット）
CREATE TABLE IF NOT EXISTS stock_price_snapshots (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES portfolio_snapshots(id) ON DELETE CASCADE,
  stock_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  current_price DECIMAL,
  shares INT NOT NULL,
  value DECIMAL NOT NULL,
  cost DECIMAL NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(snapshot_id, stock_id)
);

-- ⑲ chart_memos（チャートメモ）
CREATE TABLE IF NOT EXISTS chart_memos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  chart_type TEXT NOT NULL,
  symbol TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, snapshot_date, chart_type, symbol)
);

-- ⑳ user_gamification（ゲーミフィケーション状態）
CREATE TABLE IF NOT EXISTS user_gamification (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  total_xp INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  daily_xp INT NOT NULL DEFAULT 0,
  daily_xp_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ㉑ xp_activity_logs（XPアクティビティログ）
CREATE TABLE IF NOT EXISTS xp_activity_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  xp_earned INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. インデックス作成
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stocks_user_id_order ON stocks (user_id, "order");
CREATE INDEX IF NOT EXISTS idx_stock_positions_stock_id ON stock_positions (stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_events_stock_id ON stock_events (stock_id);
CREATE INDEX IF NOT EXISTS idx_stock_tags_stock_id ON stock_tags (stock_id);
CREATE INDEX IF NOT EXISTS idx_favorite_groups_user_id ON favorite_groups (user_id);
CREATE INDEX IF NOT EXISTS idx_stock_favorite_groups_group_id ON stock_favorite_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_stock_favorite_groups_stock_id ON stock_favorite_groups (stock_id);
CREATE INDEX IF NOT EXISTS idx_snoozed_alerts_user_id ON snoozed_alerts (user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id_date ON portfolio_snapshots (user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_stock_price_snapshots_snapshot_id ON stock_price_snapshots (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_chart_memos_user_id ON chart_memos (user_id);
CREATE INDEX IF NOT EXISTS idx_user_external_links_user_id ON user_external_links (user_id);
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks (user_id);
CREATE INDEX IF NOT EXISTS idx_xp_activity_logs_user_id_created ON xp_activity_logs (user_id, created_at DESC);

-- ============================================
-- 4. RLS（Row Level Security）有効化 & ポリシー設定
-- ============================================

-- ① app_users: 自分のプロフィールのみ
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON app_users;
CREATE POLICY "Users can manage their own profile"
ON app_users FOR ALL
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- ② stocks: 自分の銘柄のみ
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stocks" ON stocks;
CREATE POLICY "Users can manage their own stocks"
ON stocks FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ③ stock_memos: 自分の銘柄のメモのみ
ALTER TABLE stock_memos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock memos" ON stock_memos;
CREATE POLICY "Users can manage their own stock memos"
ON stock_memos FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ④ stock_prices
ALTER TABLE stock_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock prices" ON stock_prices;
CREATE POLICY "Users can manage their own stock prices"
ON stock_prices FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑤ stock_positions
ALTER TABLE stock_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock positions" ON stock_positions;
CREATE POLICY "Users can manage their own stock positions"
ON stock_positions FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑥ stock_events
ALTER TABLE stock_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock events" ON stock_events;
CREATE POLICY "Users can manage their own stock events"
ON stock_events FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑦ stock_dividends
ALTER TABLE stock_dividends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock dividends" ON stock_dividends;
CREATE POLICY "Users can manage their own stock dividends"
ON stock_dividends FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑧ stock_benefits
ALTER TABLE stock_benefits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock benefits" ON stock_benefits;
CREATE POLICY "Users can manage their own stock benefits"
ON stock_benefits FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑨ stock_tags
ALTER TABLE stock_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock tags" ON stock_tags;
CREATE POLICY "Users can manage their own stock tags"
ON stock_tags FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑩ next_action_plans
ALTER TABLE next_action_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own next action plans" ON next_action_plans;
CREATE POLICY "Users can manage their own next action plans"
ON next_action_plans FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑪ favorite_groups
ALTER TABLE favorite_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own favorite groups" ON favorite_groups;
CREATE POLICY "Users can manage their own favorite groups"
ON favorite_groups FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑫ stock_favorite_groups
ALTER TABLE stock_favorite_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock favorite groups" ON stock_favorite_groups;
CREATE POLICY "Users can manage their own stock favorite groups"
ON stock_favorite_groups FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑬ snoozed_alerts
ALTER TABLE snoozed_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own snoozed alerts" ON snoozed_alerts;
CREATE POLICY "Users can manage their own snoozed alerts"
ON snoozed_alerts FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑭ stock_tab_states
ALTER TABLE stock_tab_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own tab states" ON stock_tab_states;
CREATE POLICY "Users can manage their own tab states"
ON stock_tab_states FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));

-- ⑮ user_external_links
ALTER TABLE user_external_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own external links" ON user_external_links;
CREATE POLICY "Users can manage their own external links"
ON user_external_links FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑯ feedbacks
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own feedbacks" ON feedbacks;
CREATE POLICY "Users can manage their own feedbacks"
ON feedbacks FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑰ portfolio_snapshots
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own portfolio snapshots" ON portfolio_snapshots;
CREATE POLICY "Users can manage their own portfolio snapshots"
ON portfolio_snapshots FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑱ stock_price_snapshots
ALTER TABLE stock_price_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock price snapshots" ON stock_price_snapshots;
CREATE POLICY "Users can manage their own stock price snapshots"
ON stock_price_snapshots FOR ALL
USING (snapshot_id IN (SELECT id FROM portfolio_snapshots WHERE user_id::text = auth.uid()::text))
WITH CHECK (snapshot_id IN (SELECT id FROM portfolio_snapshots WHERE user_id::text = auth.uid()::text));

-- ⑲ chart_memos
ALTER TABLE chart_memos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own chart memos" ON chart_memos;
CREATE POLICY "Users can manage their own chart memos"
ON chart_memos FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑳ user_gamification
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own gamification" ON user_gamification;
CREATE POLICY "Users can manage their own gamification"
ON user_gamification FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ㉑ xp_activity_logs
ALTER TABLE xp_activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own xp activity logs" ON xp_activity_logs;
CREATE POLICY "Users can manage their own xp activity logs"
ON xp_activity_logs FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================
-- 5. updated_at 自動更新トリガー
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at カラムを持つ全テーブルにトリガーを設定
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'app_users', 'stocks', 'stock_memos', 'stock_prices',
    'stock_positions', 'stock_events', 'stock_dividends', 'stock_benefits',
    'next_action_plans', 'favorite_groups', 'stock_tab_states',
    'user_external_links', 'portfolio_snapshots', 'chart_memos',
    'user_gamification'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS update_%s_updated_at ON %I; CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl, tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================
-- 6. 確認クエリ
-- ============================================

-- テーブル一覧
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- RLSポリシー一覧
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
