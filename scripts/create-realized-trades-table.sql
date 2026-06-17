-- 確定損益テーブル（売却ごとに1レコード・永久保存）
-- Supabase SQL Editor で本番・開発の両DBに対して実行すること
CREATE TABLE IF NOT EXISTS realized_trades (
  id TEXT PRIMARY KEY,
  stock_id TEXT NOT NULL REFERENCES stocks(id) ON DELETE CASCADE,
  sold_shares INT NOT NULL,                 -- 売却株数
  sell_price DECIMAL NOT NULL,              -- 売却単価（1株あたり）
  cost_basis DECIMAL NOT NULL,              -- 売却時点の加重平均取得単価
  sell_date TEXT NOT NULL,                  -- 売却日（YYYY-MM-DD, JST）
  realized_pl DECIMAL NOT NULL,             -- 実現損益（税引前）= (sell_price - cost_basis) * sold_shares
  tax_rate DECIMAL NOT NULL,                -- 売却時の加重平均税率（0=NISA, 0.20315=特定口座）
  consumed_lots JSONB NOT NULL DEFAULT '[]'::jsonb, -- 消し込んだ買いロットの内訳 [{shares, purchaseDate}]（取得日の保全）
  memo TEXT,                                -- 売却理由メモ
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_realized_trades_stock_id ON realized_trades (stock_id);

-- RLS有効化（stock_id 経由で所有者を判定。stock_positions と同パターン）
ALTER TABLE realized_trades ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own realized trades" ON realized_trades;
CREATE POLICY "Users can manage their own realized trades"
ON realized_trades FOR ALL
USING (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text))
WITH CHECK (stock_id IN (SELECT id FROM stocks WHERE user_id::text = auth.uid()::text));
