-- 投資日記ニュースアイテムテーブル
CREATE TABLE diary_news_items (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  diary_id TEXT NOT NULL REFERENCES investment_diaries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_news_items_diary ON diary_news_items(diary_id);
CREATE INDEX idx_diary_news_items_user_date ON diary_news_items(user_id, created_at DESC);

-- RLS有効化
ALTER TABLE diary_news_items ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can manage own diary news items"
  ON diary_news_items FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
