-- 配当情報テーブルの RLS ポリシー設定
-- Supabase Dashboard > SQL Editor で実行してください

ALTER TABLE public.stock_dividends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own stock dividends"
ON public.stock_dividends FOR ALL
USING (
  stock_id IN (
    SELECT s.id FROM stocks s WHERE s.user_id = auth.uid()::text
  )
)
WITH CHECK (
  stock_id IN (
    SELECT s.id FROM stocks s WHERE s.user_id = auth.uid()::text
  )
);
