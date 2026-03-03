-- ============================================================
-- マイグレーション: stock_favorite_groups テーブル追加
-- お気に入りグループと銘柄の多対多の中間テーブル
-- 実行場所: Supabase Dashboard > SQL Editor
-- ============================================================

-- stock_favorite_groups テーブル作成
CREATE TABLE IF NOT EXISTS public.stock_favorite_groups (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    stock_id   TEXT NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
    group_id   TEXT NOT NULL REFERENCES public.favorite_groups(id) ON DELETE CASCADE,
    CONSTRAINT stock_favorite_groups_unique UNIQUE (stock_id, group_id)
);

-- インデックス（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_sfg_stock_id ON public.stock_favorite_groups(stock_id);
CREATE INDEX IF NOT EXISTS idx_sfg_group_id ON public.stock_favorite_groups(group_id);

-- RLS 有効化
ALTER TABLE public.stock_favorite_groups ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー: 自分のグループに紐づく銘柄のみ操作可能
--   group_id → favorite_groups.id → favorite_groups.user_id = auth.uid() で認証
CREATE POLICY "Users can manage their own stock favorite groups"
ON public.stock_favorite_groups FOR ALL
USING (
    group_id IN (
        SELECT fg.id
        FROM public.favorite_groups fg
        WHERE fg.user_id = auth.uid()::text
    )
)
WITH CHECK (
    group_id IN (
        SELECT fg.id
        FROM public.favorite_groups fg
        WHERE fg.user_id = auth.uid()::text
    )
);

-- 確認クエリ
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'stock_favorite_groups'
ORDER BY ordinal_position;
