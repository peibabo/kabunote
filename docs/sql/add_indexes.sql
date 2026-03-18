-- パフォーマンス最適化: 外部キーインデックス追加
-- Supabase SQL Editorで実行してください

-- 銘柄テーブル: ユーザーID + 表示順序（メインダッシュボードのクエリ高速化）
CREATE INDEX IF NOT EXISTS idx_stocks_user_id_order ON stocks (user_id, "order");

-- ポジションテーブル: 銘柄ID（1銘柄に複数ポジション）
CREATE INDEX IF NOT EXISTS idx_stock_positions_stock_id ON stock_positions (stock_id);

-- イベントテーブル: 銘柄ID
CREATE INDEX IF NOT EXISTS idx_stock_events_stock_id ON stock_events (stock_id);

-- タグテーブル: 銘柄ID
CREATE INDEX IF NOT EXISTS idx_stock_tags_stock_id ON stock_tags (stock_id);

-- お気に入りグループ: ユーザーID
CREATE INDEX IF NOT EXISTS idx_favorite_groups_user_id ON favorite_groups (user_id);

-- ポートフォリオスナップショット: ユーザーID + 日付（範囲クエリ高速化）
CREATE INDEX IF NOT EXISTS idx_portfolio_snapshots_user_id_date ON portfolio_snapshots (user_id, snapshot_date);

-- 銘柄別スナップショット: スナップショットID
CREATE INDEX IF NOT EXISTS idx_stock_price_snapshots_snapshot_id ON stock_price_snapshots (snapshot_id);

-- アラートスヌーズ: ユーザーID
CREATE INDEX IF NOT EXISTS idx_snoozed_alerts_user_id ON snoozed_alerts (user_id);

-- お気に入りグループ中間テーブル: グループID, 銘柄ID
CREATE INDEX IF NOT EXISTS idx_stock_favorite_groups_group_id ON stock_favorite_groups (group_id);
CREATE INDEX IF NOT EXISTS idx_stock_favorite_groups_stock_id ON stock_favorite_groups (stock_id);

-- チャートメモ: ユーザーID
CREATE INDEX IF NOT EXISTS idx_chart_memos_user_id ON chart_memos (user_id);

-- 外部リンク: ユーザーID
CREATE INDEX IF NOT EXISTS idx_user_external_links_user_id ON user_external_links (user_id);

-- フィードバック: ユーザーID
CREATE INDEX IF NOT EXISTS idx_feedbacks_user_id ON feedbacks (user_id);
