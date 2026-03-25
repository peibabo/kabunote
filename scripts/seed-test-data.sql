-- ============================================================
-- カブノオト テストデータ投入スクリプト
-- 対象: dev環境 app_users.id = 'fd0c0587-d9ef-457e-8b1f-dc409a47b54d'
-- 用途: スクリーンショット撮影・デモ用のリアルなダミーデータ
-- 実行: Supabase SQL Editor で実行
-- ============================================================

-- 変数定義
DO $$
DECLARE
  v_user_id TEXT := 'fd0c0587-d9ef-457e-8b1f-dc409a47b54d';
  v_stock1_id TEXT := 'test-stock-toyota-7203';
  v_stock2_id TEXT := 'test-stock-sony-6758';
  v_stock3_id TEXT := 'test-stock-ntt-9432';
  v_stock4_id TEXT := 'test-stock-kddi-9433';
  v_stock5_id TEXT := 'test-stock-shin-etsu-4063';
  v_stock6_id TEXT := 'test-stock-keyence-6861';
  v_stock7_id TEXT := 'test-stock-mitsubishi-8058';
  v_stock8_id TEXT := 'test-stock-itochu-8001';
  v_group1_id TEXT := 'test-group-high-dividend';
  v_group2_id TEXT := 'test-group-growth';
  v_checklist1_id TEXT := 'test-checklist-1';
  v_checklist2_id TEXT := 'test-checklist-2';
  v_checklist3_id TEXT := 'test-checklist-3';
  v_checklist4_id TEXT := 'test-checklist-4';
  v_checklist5_id TEXT := 'test-checklist-5';
  v_diary1_id TEXT := 'test-diary-today';
  v_diary2_id TEXT := 'test-diary-yesterday';
  v_snapshot1_id TEXT := 'test-snapshot-today';
  v_snapshot2_id TEXT := 'test-snapshot-yesterday';
  v_snapshot3_id TEXT := 'test-snapshot-2days';
BEGIN

-- ============================================================
-- 0. 既存データのクリーンアップ（CASCADE で関連データも削除される）
-- ============================================================
DELETE FROM stocks WHERE user_id = v_user_id;
DELETE FROM portfolio_snapshots WHERE user_id = v_user_id;
DELETE FROM chart_memos WHERE user_id = v_user_id;
DELETE FROM user_gamification WHERE user_id = v_user_id;
DELETE FROM xp_activity_logs WHERE user_id = v_user_id;
DELETE FROM checklist_checks WHERE user_id = v_user_id;
DELETE FROM user_checklists WHERE user_id = v_user_id;
DELETE FROM investment_diaries WHERE user_id = v_user_id;
DELETE FROM favorite_groups WHERE user_id = v_user_id;

-- ============================================================
-- 1. ユーザー設定の更新
-- ============================================================
UPDATE app_users SET
  cash_amount = 1500000,
  next_action_memo = '日経平均が38,000円を割ったら、トヨタとKDDIを買い増し検討',
  onboarding_completed = true,
  updated_at = NOW()
WHERE id = v_user_id;

-- ============================================================
-- 2. 銘柄データ（8銘柄）
-- ============================================================
INSERT INTO stocks (id, user_id, symbol, name, sector, market, "order", created_at, updated_at) VALUES
  (v_stock1_id, v_user_id, '7203', 'トヨタ自動車', '輸送用機器', 'プライム', 0, NOW() - interval '90 days', NOW()),
  (v_stock2_id, v_user_id, '6758', 'ソニーグループ', '電気機器', 'プライム', 1, NOW() - interval '60 days', NOW()),
  (v_stock3_id, v_user_id, '9432', '日本電信電話', '情報・通信業', 'プライム', 2, NOW() - interval '120 days', NOW()),
  (v_stock4_id, v_user_id, '9433', 'KDDI', '情報・通信業', 'プライム', 3, NOW() - interval '80 days', NOW()),
  (v_stock5_id, v_user_id, '4063', '信越化学工業', '化学', 'プライム', 4, NOW() - interval '45 days', NOW()),
  (v_stock6_id, v_user_id, '6861', 'キーエンス', '電気機器', 'プライム', 5, NOW() - interval '30 days', NOW()),
  (v_stock7_id, v_user_id, '8058', '三菱商事', '卸売業', 'プライム', 6, NOW() - interval '150 days', NOW()),
  (v_stock8_id, v_user_id, '8001', '伊藤忠商事', '卸売業', 'プライム', 7, NOW() - interval '100 days', NOW());

-- ============================================================
-- 3. 株価情報（損切り/利確/PER/PBR設定）
-- ============================================================
INSERT INTO stock_prices (id, stock_id, current_price, target_price, stop_loss_price, per, pbr, fair_per, fair_pbr, created_at, updated_at) VALUES
  ('test-price-7203', v_stock1_id, 2850, 3500, 2400, 10.5, 1.2, 12.0, 1.0, NOW(), NOW()),
  ('test-price-6758', v_stock2_id, 3180, 4000, 2700, 18.2, 2.5, 20.0, 2.0, NOW(), NOW()),
  ('test-price-9432', v_stock3_id, 155, 185, 130, 11.8, 1.4, 13.0, 1.3, NOW(), NOW()),
  ('test-price-9433', v_stock4_id, 4850, 5500, 4200, 14.3, 1.9, 15.0, 1.8, NOW(), NOW()),
  ('test-price-4063', v_stock5_id, 5620, 7000, 4800, 22.1, 3.1, 25.0, 2.5, NOW(), NOW()),
  ('test-price-6861', v_stock6_id, 68500, 80000, 58000, 38.5, 7.2, 40.0, 6.0, NOW(), NOW()),
  ('test-price-8058', v_stock7_id, 2680, 3200, 2200, 8.9, 1.1, 10.0, 1.0, NOW(), NOW()),
  ('test-price-8001', v_stock8_id, 7250, 8500, 6200, 10.8, 1.8, 12.0, 1.5, NOW(), NOW())
;

-- ============================================================
-- 4. 保有ポジション（複数ロット含む）
-- ============================================================
INSERT INTO stock_positions (id, stock_id, shares, purchase_price, purchase_date, memo, tax_rate, created_at, updated_at) VALUES
  -- トヨタ: 2ロット（NISA + 特定口座）
  ('test-pos-7203-1', v_stock1_id, 100, 2600, '2025-12-15', 'NISA枠で購入', 0, NOW(), NOW()),
  ('test-pos-7203-2', v_stock1_id, 200, 2750, '2026-01-20', '押し目で追加', 0.20315, NOW(), NOW()),
  -- ソニー
  ('test-pos-6758-1', v_stock2_id, 100, 3050, '2026-01-10', 'PS6発表前に仕込み', 0.20315, NOW(), NOW()),
  -- NTT: 大量保有
  ('test-pos-9432-1', v_stock3_id, 2000, 148, '2025-10-01', '25分割後に長期保有目的', 0, NOW(), NOW()),
  ('test-pos-9432-2', v_stock3_id, 1000, 160, '2026-02-05', 'ナンピン', 0.20315, NOW(), NOW()),
  -- KDDI
  ('test-pos-9433-1', v_stock4_id, 100, 4500, '2026-01-05', '高配当+優待狙い', 0, NOW(), NOW()),
  -- 信越化学（ウォッチのみ、ポジションなし）
  -- キーエンス（ウォッチのみ、ポジションなし）
  -- 三菱商事
  ('test-pos-8058-1', v_stock7_id, 300, 2400, '2025-08-20', 'バフェット銘柄', 0.20315, NOW(), NOW()),
  -- 伊藤忠
  ('test-pos-8001-1', v_stock8_id, 100, 6800, '2025-11-10', '商社株分散', 0.20315, NOW(), NOW());

-- ============================================================
-- 5. 銘柄メモ
-- ============================================================
INSERT INTO stock_memos (id, stock_id, content, created_at, updated_at) VALUES
  ('test-memo-7203', v_stock1_id, '## トヨタ自動車 投資メモ

### 投資判断の理由
- EV戦略の転換（全方位戦略）が評価される局面
- 円安メリット銘柄（1円で約500億円の営業利益増）
- PER 10倍台は割安水準

### 注目ポイント
- 次回決算: 2026年5月 → ガイダンスに注目
- 為替前提: 145円/ドル（現在より保守的）
- BEV販売台数の推移

### リスク
- 中国市場の競争激化
- 米国関税リスク', NOW(), NOW()),

  ('test-memo-6758', v_stock2_id, '## ソニーグループ

### 投資判断の理由
- ゲーム・音楽・映画の3本柱が安定成長
- PS6の発表サイクル入り
- 半導体（イメージセンサー）の回復期待

### 懸念点
- 金融事業の分離影響
- 為替の影響（海外売上比率70%超）', NOW(), NOW()),

  ('test-memo-9432', v_stock3_id, '## NTT

長期保有の柱。25分割で買いやすくなった。
配当利回り3%超で安定。IOWN構想の進捗に注目。', NOW(), NOW()),

  ('test-memo-9433', v_stock4_id, '## KDDI

配当+優待のダブルインカム銘柄。
au経済圏の拡大（ローソン統合）に期待。', NOW(), NOW()),

  ('test-memo-4063', v_stock5_id, '## 信越化学

シリコンウェハー世界首位。半導体サイクルの底打ち確認後にエントリーしたい。
目標買値: 5000円以下', NOW(), NOW()),

  ('test-memo-8058', v_stock7_id, '## 三菱商事

バフェットが追加投資した商社株。資源高メリット。
累進配当方針で下値は限定的。', NOW(), NOW())
;

-- ============================================================
-- 6. 決算・株主総会イベント
-- ============================================================
INSERT INTO stock_events (id, stock_id, event_type, event_date, event_month, event_day, is_recurring, is_active, created_at, updated_at) VALUES
  ('test-event-7203-e', v_stock1_id, 'EARNINGS', '2026-05-08', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-7203-s', v_stock1_id, 'SHAREHOLDER_MEETING', NULL, 6, 15, true, true, NOW(), NOW()),
  ('test-event-6758-e', v_stock2_id, 'EARNINGS', '2026-04-28', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-9432-e', v_stock3_id, 'EARNINGS', '2026-05-12', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-9433-e', v_stock4_id, 'EARNINGS', '2026-05-09', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-4063-e', v_stock5_id, 'EARNINGS', '2026-04-25', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-8058-e', v_stock7_id, 'EARNINGS', '2026-05-02', NULL, NULL, true, true, NOW(), NOW()),
  ('test-event-8001-e', v_stock8_id, 'EARNINGS', '2026-05-07', NULL, NULL, true, true, NOW(), NOW())
;

-- ============================================================
-- 7. 配当情報
-- ============================================================
INSERT INTO stock_dividends (id, stock_id, dividend_per_share, frequency, rights_month, rights_day, created_at, updated_at) VALUES
  ('test-div-7203', v_stock1_id, 75, 2, 3, 31, NOW(), NOW()),
  ('test-div-6758', v_stock2_id, 50, 2, 3, 31, NOW(), NOW()),
  ('test-div-9432', v_stock3_id, 5.2, 2, 3, 31, NOW(), NOW()),
  ('test-div-9433', v_stock4_id, 145, 2, 3, 31, NOW(), NOW()),
  ('test-div-4063', v_stock5_id, 100, 2, 3, 31, NOW(), NOW()),
  ('test-div-8058', v_stock7_id, 100, 2, 3, 31, NOW(), NOW()),
  ('test-div-8001', v_stock8_id, 200, 2, 3, 31, NOW(), NOW())
;

-- ============================================================
-- 8. 株主優待
-- ============================================================
INSERT INTO stock_benefits (id, stock_id, description, minimum_shares, estimated_value, rights_month, rights_day, created_at, updated_at) VALUES
  ('test-ben-9433', v_stock4_id, 'Pontaポイント3,000円分（カタログギフトも選択可）', 100, 3000, 3, 31, NOW(), NOW()),
  ('test-ben-8001', v_stock8_id, 'オリジナルカレンダー', 100, 500, 3, 31, NOW(), NOW())
;

-- ============================================================
-- 9. タグ
-- ============================================================
INSERT INTO stock_tags (id, stock_id, name, color, created_at) VALUES
  ('test-tag-7203-1', v_stock1_id, '高配当', 'green', NOW()),
  ('test-tag-7203-2', v_stock1_id, '円安メリット', 'blue', NOW()),
  ('test-tag-6758-1', v_stock2_id, '成長株', 'purple', NOW()),
  ('test-tag-6758-2', v_stock2_id, 'エンタメ', 'pink', NOW()),
  ('test-tag-9432-1', v_stock3_id, '高配当', 'green', NOW()),
  ('test-tag-9432-2', v_stock3_id, 'インフラ', 'blue', NOW()),
  ('test-tag-9433-1', v_stock4_id, '高配当', 'green', NOW()),
  ('test-tag-9433-2', v_stock4_id, '優待', 'yellow', NOW()),
  ('test-tag-4063-1', v_stock5_id, '半導体', 'blue', NOW()),
  ('test-tag-4063-2', v_stock5_id, 'ウォッチ', 'gray', NOW()),
  ('test-tag-6861-1', v_stock6_id, '成長株', 'purple', NOW()),
  ('test-tag-6861-2', v_stock6_id, 'ウォッチ', 'gray', NOW()),
  ('test-tag-8058-1', v_stock7_id, '高配当', 'green', NOW()),
  ('test-tag-8058-2', v_stock7_id, 'バフェット', 'orange', NOW()),
  ('test-tag-8001-1', v_stock8_id, '高配当', 'green', NOW()),
  ('test-tag-8001-2', v_stock8_id, 'バフェット', 'orange', NOW());

-- ============================================================
-- 10. 次の一手（Next Action Plan）
-- ============================================================
INSERT INTO next_action_plans (id, stock_id, action_type, priority, target_price, target_shares, strategy_memo, created_at, updated_at) VALUES
  ('test-nap-7203', v_stock1_id, 'BUY', 'MEDIUM', 2600, 100, '2600円まで下がったらNISA枠で100株追加。決算前の押し目を狙う。', NOW(), NOW()),
  ('test-nap-6758', v_stock2_id, 'HOLD', 'LOW', NULL, NULL, 'PS6発表まではホールド。4000円到達で半分利確。', NOW(), NOW()),
  ('test-nap-9432', v_stock3_id, 'BUY', 'HIGH', 145, 1000, '145円以下で1000株追加。配当利回り3.5%超えが目安。', NOW(), NOW()),
  ('test-nap-9433', v_stock4_id, 'HOLD', 'LOW', NULL, NULL, '優待権利確定月（3月・9月）前に売らない。長期保有。', NOW(), NOW()),
  ('test-nap-4063', v_stock5_id, 'BUY', 'HIGH', 5000, 100, '半導体サイクル底打ち確認後、5000円以下でエントリー。', NOW(), NOW()),
  ('test-nap-6861', v_stock6_id, 'BUY', 'LOW', 60000, 10, '60000円割れで打診買い。FA事業の回復を確認してから本格参入。', NOW(), NOW()),
  ('test-nap-8058', v_stock7_id, 'SELL', 'MEDIUM', 3200, 100, '3200円到達で100株利確。残り200株は長期保有。', NOW(), NOW()),
  ('test-nap-8001', v_stock8_id, 'HOLD', 'LOW', NULL, NULL, '累進配当方針を信頼してホールド。', NOW(), NOW())
;

-- ============================================================
-- 11. お気に入りグループ
-- ============================================================
INSERT INTO favorite_groups (id, user_id, name, color, "order", created_at, updated_at) VALUES
  (v_group1_id, v_user_id, '高配当ポートフォリオ', 'green', 0, NOW(), NOW()),
  (v_group2_id, v_user_id, '成長株ウォッチ', 'purple', 1, NOW(), NOW())
;

INSERT INTO stock_favorite_groups (id, stock_id, group_id) VALUES
  ('test-sfg-1', v_stock1_id, v_group1_id),
  ('test-sfg-2', v_stock3_id, v_group1_id),
  ('test-sfg-3', v_stock4_id, v_group1_id),
  ('test-sfg-4', v_stock7_id, v_group1_id),
  ('test-sfg-5', v_stock8_id, v_group1_id),
  ('test-sfg-6', v_stock5_id, v_group2_id),
  ('test-sfg-7', v_stock6_id, v_group2_id),
  ('test-sfg-8', v_stock2_id, v_group2_id);

-- ============================================================
-- 12. ゲーミフィケーション
-- ============================================================
INSERT INTO user_gamification (id, user_id, total_xp, level, daily_xp, daily_xp_date, current_streak, longest_streak, last_active_date, notified_title_ids, created_at, updated_at) VALUES
  ('test-gami', v_user_id, 1250, 6, 45, CURRENT_DATE, 14, 21, CURRENT_DATE, ARRAY['first-login', 'memo-master', 'streak-7'], NOW(), NOW())
;
INSERT INTO xp_activity_logs (id, user_id, action_type, xp_earned, description, created_at) VALUES
  ('test-xp-1', v_user_id, 'daily_login', 10, 'デイリーログイン', NOW()),
  ('test-xp-2', v_user_id, 'memo_update', 15, '銘柄メモを更新', NOW() - interval '1 hour'),
  ('test-xp-3', v_user_id, 'diary_write', 20, '投資日記を記入', NOW() - interval '2 hours'),
  ('test-xp-4', v_user_id, 'checklist_complete', 10, 'チェックリスト完了', NOW() - interval '1 day'),
  ('test-xp-5', v_user_id, 'price_update', 5, '株価を更新', NOW() - interval '1 day');

-- ============================================================
-- 13. デイリーチェックリスト
-- ============================================================
INSERT INTO user_checklists (id, user_id, label, "order", created_at, updated_at) VALUES
  (v_checklist1_id, v_user_id, '日経平均・NYダウの確認', 0, NOW(), NOW()),
  (v_checklist2_id, v_user_id, '保有銘柄の株価チェック', 1, NOW(), NOW()),
  (v_checklist3_id, v_user_id, '今日のニュースを確認', 2, NOW(), NOW()),
  (v_checklist4_id, v_user_id, '次の一手の見直し', 3, NOW(), NOW()),
  (v_checklist5_id, v_user_id, '投資日記を書く', 4, NOW(), NOW());

-- 今日のチェック（3/5完了）
INSERT INTO checklist_checks (id, checklist_id, user_id, checked_date, created_at) VALUES
  ('test-check-1', v_checklist1_id, v_user_id, CURRENT_DATE, NOW()),
  ('test-check-2', v_checklist2_id, v_user_id, CURRENT_DATE, NOW()),
  ('test-check-3', v_checklist3_id, v_user_id, CURRENT_DATE, NOW());

-- ============================================================
-- 14. 投資日記
-- ============================================================
INSERT INTO investment_diaries (id, user_id, diary_date, market_overview, news_memo, reflection, tomorrow_focus, created_at, updated_at) VALUES
  (v_diary1_id, v_user_id, CURRENT_DATE,
    '日経平均は前日比+180円の38,420円で引け。半導体セクターが牽引。円安進行（151円台）も追い風。',
    '三菱商事がLNG新規プロジェクトを発表。商社株全般に好材料。NTTのIOWN実証実験が報道された。',
    '信越化学のウォッチを続けているが、まだ5000円を割らない。焦らずに待つ。三菱商事は含み益が拡大中だが、利確ラインまでまだ距離がある。',
    'ソニーの決算発表（4/28）に向けてポジションの見直し。トヨタの為替感応度を再チェック。',
    NOW(), NOW()),
  (v_diary2_id, v_user_id, CURRENT_DATE - interval '1 day',
    '日経平均は小幅反落。米国金利上昇を嫌気して利益確定売りが優勢。',
    'KDDIとローソンの統合進捗が発表。au経済圏の拡大に期待。',
    'NTTのナンピンは時期尚早だったかもしれない。もう少し下で拾いたかった。次回は分割して買う。',
    '信越化学の決算（4/25）が近い。事前に分析しておく。',
    NOW(), NOW())
;

-- 日記のニュースアイテム
INSERT INTO diary_news_items (id, diary_id, user_id, url, comment, "order", created_at) VALUES
  ('test-dnews-1', v_diary1_id, v_user_id, 'https://www.nikkei.com/', '三菱商事LNG新規プロジェクト', 0, NOW()),
  ('test-dnews-2', v_diary1_id, v_user_id, 'https://www.nikkei.com/', 'NTT IOWN実証実験', 1, NOW());

-- ============================================================
-- 15. ポートフォリオスナップショット（3日分）
-- ============================================================
INSERT INTO portfolio_snapshots (id, user_id, snapshot_date, total_investment, total_value, profit_loss, cash_amount, net_assets, created_at, updated_at) VALUES
  (v_snapshot1_id, v_user_id, CURRENT_DATE,
    4986000,  -- 総投資額
    5383500,  -- 現在評価額
    397500,   -- 損益
    1500000,  -- 現金
    6883500,  -- 純資産
    NOW(), NOW()),
  (v_snapshot2_id, v_user_id, CURRENT_DATE - interval '1 day',
    4986000,
    5340000,
    354000,
    1500000,
    6840000,
    NOW(), NOW()),
  (v_snapshot3_id, v_user_id, CURRENT_DATE - interval '2 days',
    4986000,
    5290000,
    304000,
    1500000,
    6790000,
    NOW(), NOW())
;

-- 銘柄別スナップショット（今日分）
INSERT INTO stock_price_snapshots (id, snapshot_id, stock_id, symbol, current_price, shares, value, cost, created_at) VALUES
  ('test-sps-7203', v_snapshot1_id, v_stock1_id, '7203', 2850, 300, 855000, 810000, NOW()),
  ('test-sps-6758', v_snapshot1_id, v_stock2_id, '6758', 3180, 100, 318000, 305000, NOW()),
  ('test-sps-9432', v_snapshot1_id, v_stock3_id, '9432', 155, 3000, 465000, 456000, NOW()),
  ('test-sps-9433', v_snapshot1_id, v_stock4_id, '9433', 4850, 100, 485000, 450000, NOW()),
  ('test-sps-8058', v_snapshot1_id, v_stock7_id, '8058', 2680, 300, 804000, 720000, NOW()),
  ('test-sps-8001', v_snapshot1_id, v_stock8_id, '8001', 7250, 100, 725000, 680000, NOW())
;

-- ============================================================
-- 16. チャートメモ
-- ============================================================
INSERT INTO chart_memos (id, user_id, snapshot_date, chart_type, symbol, content, created_at, updated_at) VALUES
  ('test-cm-1', v_user_id, CURRENT_DATE - interval '5 days', 'portfolio', '', '三菱商事の含み益が拡大し、ポートフォリオ全体がプラス転換', NOW(), NOW()),
  ('test-cm-2', v_user_id, CURRENT_DATE - interval '10 days', 'portfolio', '', '日経平均の急落でNTTが大きく下げた。ナンピンのタイミングか検討', NOW(), NOW()),
  ('test-cm-3', v_user_id, CURRENT_DATE - interval '3 days', 'stock', '7203', 'トヨタ: 為替が150円を超え、株価が2800円台に回復', NOW(), NOW())
;

-- ============================================================
-- 17. 銘柄ニュースクリップ
-- ============================================================
INSERT INTO stock_news_items (id, stock_id, user_id, url, comment, "order", created_at) VALUES
  ('test-snews-1', v_stock1_id, v_user_id, 'https://www.nikkei.com/', 'トヨタ EV戦略見直し報道', 0, NOW()),
  ('test-snews-2', v_stock1_id, v_user_id, 'https://www.nikkei.com/', '為替感応度の分析記事', 1, NOW()),
  ('test-snews-3', v_stock7_id, v_user_id, 'https://www.nikkei.com/', '三菱商事 LNG新規プロジェクト', 0, NOW()),
  ('test-snews-4', v_stock3_id, v_user_id, 'https://www.nikkei.com/', 'NTT IOWN構想の進捗', 0, NOW());

RAISE NOTICE 'テストデータの投入が完了しました！';
RAISE NOTICE '銘柄数: 8（保有6 + ウォッチ2）';
RAISE NOTICE 'ポジション数: 8（複数ロット含む）';
RAISE NOTICE 'チェックリスト: 5項目（3/5完了）';
RAISE NOTICE '投資日記: 2日分';
RAISE NOTICE 'ゲーミフィケーション: Lv.6 / 14日連続ストリーク';

END $$;
