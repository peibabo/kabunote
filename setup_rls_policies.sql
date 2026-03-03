-- ============================================
-- 全テーブルのRLS有効化＆ポリシー設定
-- Supabase SQL Editorで実行してください
-- ============================================

-- ① app_users
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.app_users;
CREATE POLICY "Users can manage their own profile"
ON public.app_users FOR ALL
USING (id::text = auth.uid()::text)
WITH CHECK (id::text = auth.uid()::text);

-- ② stocks
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stocks" ON public.stocks;
CREATE POLICY "Users can manage their own stocks"
ON public.stocks FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ③ stock_memos
ALTER TABLE public.stock_memos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock memos" ON public.stock_memos;
CREATE POLICY "Users can manage their own stock memos"
ON public.stock_memos FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ④ stock_prices
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock prices" ON public.stock_prices;
CREATE POLICY "Users can manage their own stock prices"
ON public.stock_prices FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑤ stock_positions
ALTER TABLE public.stock_positions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock positions" ON public.stock_positions;
CREATE POLICY "Users can manage their own stock positions"
ON public.stock_positions FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑥ stock_events
ALTER TABLE public.stock_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock events" ON public.stock_events;
CREATE POLICY "Users can manage their own stock events"
ON public.stock_events FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑦ stock_dividends
ALTER TABLE public.stock_dividends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock dividends" ON public.stock_dividends;
CREATE POLICY "Users can manage their own stock dividends"
ON public.stock_dividends FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑧ stock_benefits
ALTER TABLE public.stock_benefits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock benefits" ON public.stock_benefits;
CREATE POLICY "Users can manage their own stock benefits"
ON public.stock_benefits FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑨ stock_tags
ALTER TABLE public.stock_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own stock tags" ON public.stock_tags;
CREATE POLICY "Users can manage their own stock tags"
ON public.stock_tags FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑩ next_action_plans
ALTER TABLE public.next_action_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own next action plans" ON public.next_action_plans;
CREATE POLICY "Users can manage their own next action plans"
ON public.next_action_plans FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑪ stock_tab_states
ALTER TABLE public.stock_tab_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own tab states" ON public.stock_tab_states;
CREATE POLICY "Users can manage their own tab states"
ON public.stock_tab_states FOR ALL
USING (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM public.stocks WHERE user_id::text = auth.uid()::text));

-- ⑫ favorite_groups
ALTER TABLE public.favorite_groups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own favorite groups" ON public.favorite_groups;
CREATE POLICY "Users can manage their own favorite groups"
ON public.favorite_groups FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ⑬ snoozed_alerts
ALTER TABLE public.snoozed_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own snoozed alerts" ON public.snoozed_alerts;
CREATE POLICY "Users can manage their own snoozed alerts"
ON public.snoozed_alerts FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ============================================
-- 確認クエリ
-- ============================================
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
