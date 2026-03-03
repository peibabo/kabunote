-- stock_tags テーブルの RLS ポリシー設定
-- Supabase Dashboard > SQL Editor で実行してください

ALTER TABLE public.stock_tags ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーがあれば削除
DROP POLICY IF EXISTS "Users can manage their own stock tags" ON public.stock_tags;

CREATE POLICY "Users can manage their own stock tags"
ON public.stock_tags FOR ALL
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
