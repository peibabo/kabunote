-- デイリーチェックリスト機能用テーブル作成SQL
-- Supabase SQL Editor で実行してください

-- 1. チェックリスト項目定義テーブル
CREATE TABLE user_checklists (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_checklists_user_id ON user_checklists(user_id);

-- 2. チェックリスト日次チェック記録テーブル
CREATE TABLE checklist_checks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  checklist_id TEXT NOT NULL REFERENCES user_checklists(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  checked_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_checklist_checks_unique ON checklist_checks(checklist_id, checked_date);
CREATE INDEX idx_checklist_checks_user_date ON checklist_checks(user_id, checked_date);

-- 3. RLSポリシー
ALTER TABLE user_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_checklists_select" ON user_checklists
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "user_checklists_insert" ON user_checklists
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "user_checklists_update" ON user_checklists
  FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "user_checklists_delete" ON user_checklists
  FOR DELETE USING (user_id = auth.uid()::text);

ALTER TABLE checklist_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklist_checks_select" ON checklist_checks
  FOR SELECT USING (user_id = auth.uid()::text);
CREATE POLICY "checklist_checks_insert" ON checklist_checks
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);
CREATE POLICY "checklist_checks_update" ON checklist_checks
  FOR UPDATE USING (user_id = auth.uid()::text);
CREATE POLICY "checklist_checks_delete" ON checklist_checks
  FOR DELETE USING (user_id = auth.uid()::text);
