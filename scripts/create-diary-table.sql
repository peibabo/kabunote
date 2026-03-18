-- 投資日記テーブル
CREATE TABLE investment_diaries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  diary_date DATE NOT NULL,
  market_overview TEXT NOT NULL DEFAULT '',
  news_memo TEXT NOT NULL DEFAULT '',
  reflection TEXT NOT NULL DEFAULT '',
  tomorrow_focus TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, diary_date)
);

CREATE INDEX idx_investment_diaries_user_date ON investment_diaries(user_id, diary_date DESC);

-- RLS有効化
ALTER TABLE investment_diaries ENABLE ROW LEVEL SECURITY;

-- RLSポリシー
CREATE POLICY "Users can manage own diaries"
  ON investment_diaries FOR ALL
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);
