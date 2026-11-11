-- オンボーディング計測テーブル（ウィザードのステップ通過・完了/スキップを記録）
-- Supabase SQL Editor で本番・開発の両DBに対して実行すること
CREATE TABLE IF NOT EXISTS onboarding_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,                      -- shown / step_view / get_started / later / close
  step INT NOT NULL,                        -- 0始まり。イベント発生時に表示していたステップ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_events_user_id_created ON onboarding_events (user_id, created_at);

-- RLS有効化（自分のイベントのみ）
ALTER TABLE onboarding_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own onboarding events" ON onboarding_events;
CREATE POLICY "Users can manage their own onboarding events"
ON onboarding_events FOR ALL
USING (user_id::text = auth.uid()::text)
WITH CHECK (user_id::text = auth.uid()::text);

-- ─────────────────────────────────────────
-- 集計クエリ例（JST）
-- ─────────────────────────────────────────
-- ユーザーごとの到達ステップと結果:
-- SELECT user_id,
--        max(step) AS 到達ステップ,
--        coalesce(max(event) FILTER (WHERE event IN ('get_started','later','close')), '離脱(閉じずに去った)') AS 結果,
--        min(created_at AT TIME ZONE 'Asia/Tokyo') AS 初回表示
-- FROM onboarding_events GROUP BY user_id ORDER BY 初回表示;
