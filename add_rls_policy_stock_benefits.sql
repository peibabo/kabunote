-- stock_benefits テーブルの RLS ポリシー設定
-- Supabase Dashboard > SQL Editor で実行してください

-- RLS を有効化
ALTER TABLE public.stock_benefits ENABLE ROW LEVEL SECURITY;

-- 既存ポリシーがあれば削除
DROP POLICY IF EXISTS "Users can manage their own stock benefits" ON public.stock_benefits;

-- ユーザー自身の優待情報のみアクセス可能
CREATE POLICY "Users can manage their own stock benefits"
ON public.stock_benefits FOR ALL
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
