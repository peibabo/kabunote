-- =====================================================
-- localStorageデータ インポートSQL
-- ユーザーID: 21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5
--
-- 実行前に以下を確認・修正してください:
-- 1. 'YOUR_EMAIL_HERE' → 実際のGoogle認証メールアドレス
-- 2. 3993, 2980 の会社名（NULLのままでもOK）
-- =====================================================

WITH

-- ① app_users（現金・メモ含む）
usr AS (
  INSERT INTO app_users (id, email, auth_provider, cash_amount, next_action_memo, created_at, updated_at)
  VALUES (
    '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5',
    'yuhei.awano@lib-lab.net',  -- ← ここを変更
    'google',
    450000,
    'この現金は何に使うか考え中（UFJ45万円）',
    NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    cash_amount = EXCLUDED.cash_amount,
    next_action_memo = EXCLUDED.next_action_memo,
    updated_at = NOW()
  RETURNING id
),

-- ② stocks（銘柄 6件）
stk AS (
  INSERT INTO stocks (id, user_id, symbol, name, "order", created_at, updated_at)
  SELECT
    gen_random_uuid(),
    '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5',
    v.symbol, v.name, v.ord,
    NOW(), NOW()
  FROM (VALUES
    ('5527', 'Property',      0),
    ('3093', 'トレファク',    1),
    ('5027', 'AnyMind Group', 2),
    ('4425', 'Kudan',         3),
    ('3993', 'PKSHA Technology',      4),  -- ← 会社名を入れてもOK
    ('2980', 'SREホールディングス',      5)   -- ← 会社名を入れてもOK
  ) AS v(symbol, name, ord)
  ON CONFLICT (user_id, symbol) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, stocks.name),
    "order" = EXCLUDED."order",
    updated_at = NOW()
  RETURNING id, symbol
),

-- ③ stock_memos（3093, 4425）
memos AS (
  INSERT INTO stock_memos (id, stock_id, content, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    s.id,
    CASE s.symbol
      WHEN '3093' THEN '爆発力が無いので長期的に持つか。
でも景気が良くなってくるとリユース熱が下がると思うので、良きところで売却しよう。'
      WHEN '4425' THEN 'なぜ「Kudan」なのか？（戦略的理由）
現在のあなたの保有銘柄は、実は以下のような性格を持っています。

Property (5527): 国内・不動産・安定成長（守りの主砲）

トレファク (3093): 国内・リユース・業績確実（利益の源泉）

AnyMind (5027): アジア・EC・高成長（期待の加速装置）

ここに「ハーモニック」を加えると、製造業・大型株寄りの性格が強まり、ポートフォリオが少し「重く」なります。2倍を狙うには、もう一歩「爆発力」が足りません。

一方で「Kudan」を加えると：

AI×ロボティクスという「旬」のテーマを直接取り込める。

AnyMindと同じく「市場に正当に評価されていない（赤字から黒字への転換点）」という、あなたが最も得意とする「歪み」のある銘柄である。

ソフトウェアライセンス型なので、当たった時の利益率がハーモニック（製造業）より遥かに高く、1年で2倍を狙うスピード感に合致する。

2. リスク管理：210万円の使い分け
プロとして、Kudanに全額突っ込むことは推奨しません。今のあなたの最強の武器である「210万円」をこう使い分けるのが「2倍への最短ルート」です。

【攻め】Kudanに50万円〜70万円:
「AI×ロボティクス」枠として新規採用。今のポートフォリオに欠けている「ハイテク・ディープテック」の爆発力を補完します。

【守り・追撃】AnyMindに50万円:
500円奪還時に買い増しして平均単価を下げる用。これでAnyMindの復活を加速させます。

【リザーブ】残り約100万円:
Property社が「2倍」に向けて動き出した時の追撃、あるいは予期せぬチャンス（暴落）への備えとして。

3. プロの懸念とアドバイス
Kudanは、今のAnyMind以上にボラティリティ（値動き）が激しいです。

Property社のような安定感はありません。

トレファクのような分かりやすい利益も、まだこれからです。

しかし、「誰もが確信を持っていない時期に、技術の価値を信じて仕込む」のがテンバガー（10倍株）や2倍株を掴むプロの作法です。

💡 最終結論
今のポートフォリオのバランスを考え、かつ「1年で2倍」という野心的な目標を最速で達成したいのであれば、Kudanを選び、「AI・空間知覚」という未来に賭けるのが正解です。

ハーモニックは素晴らしい企業ですが、今のあなたが必要としている「資産を急加速させるための劇薬」としては、Kudanの方が相応しいでしょう。'
    END,
    NOW(), NOW()
  FROM stk s
  WHERE s.symbol IN ('3093', '4425')
  ON CONFLICT (stock_id) DO UPDATE SET
    content = EXCLUDED.content,
    updated_at = NOW()
  RETURNING id
),

-- ④ stock_prices（株価・目標・損切り）
prices AS (
  INSERT INTO stock_prices (id, stock_id, current_price, target_price, stop_loss_price, created_at, updated_at)
  SELECT
    gen_random_uuid(),
    s.id,
    v.current_price,
    v.target_price,
    v.stop_loss_price,
    NOW(), NOW()
  FROM stk s
  JOIN (VALUES
    ('5527', 744::DECIMAL,  1400::DECIMAL, 650::DECIMAL),
    ('3093', 1849::DECIMAL, 2150::DECIMAL, 1680::DECIMAL),
    ('5027', 478::DECIMAL,  1000::DECIMAL, 450::DECIMAL),
    ('4425', 2100::DECIMAL, 2500::DECIMAL, 1900::DECIMAL),
    ('3993', NULL::DECIMAL, NULL::DECIMAL, NULL::DECIMAL),
    ('2980', NULL::DECIMAL, NULL::DECIMAL, NULL::DECIMAL)
  ) AS v(symbol, current_price, target_price, stop_loss_price)
  ON (s.symbol = v.symbol)
  ON CONFLICT (stock_id) DO UPDATE SET
    current_price   = COALESCE(EXCLUDED.current_price, stock_prices.current_price),
    target_price    = COALESCE(EXCLUDED.target_price, stock_prices.target_price),
    stop_loss_price = COALESCE(EXCLUDED.stop_loss_price, stock_prices.stop_loss_price),
    updated_at = NOW()
  RETURNING id
),

-- ⑤ stock_positions（保有ポジション）
positions AS (
  INSERT INTO stock_positions (id, stock_id, shares, purchase_price, purchase_date, memo, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, v.shares, v.purchase_price, v.purchase_date, v.memo, v.created_at, NOW()
  FROM stk s
  JOIN (VALUES
    -- 3093: トレファク 1ロット
    ('3093', 500,  1826.07::DECIMAL, '2026-01-15', 'geminiに勧められた',      '2026-02-10T09:24:54Z'::TIMESTAMPTZ),
    -- 4425: Kudan 1ロット
    ('4425', 500,  2121.28::DECIMAL, '2026-02-26', NULL::TEXT,                '2026-02-26T03:29:19Z'::TIMESTAMPTZ),
    -- 5027: AnyMind 2ロット
    ('5027', 1500, 556.95::DECIMAL,  '2026-02-16', '決算後のパニック売りを拾った', '2026-02-16T00:58:54Z'::TIMESTAMPTZ),
    ('5027', 1000, 523.48::DECIMAL,  '2026-02-26', NULL::TEXT,                '2026-02-26T05:40:55Z'::TIMESTAMPTZ),
    -- 5527: Property 2ロット
    ('5527', 1800, 822.88::DECIMAL,  '2025-12-01', NULL::TEXT,                '2026-02-10T09:25:33Z'::TIMESTAMPTZ),
    ('5527', 2500, 769.30::DECIMAL,  '2026-01-10', NULL::TEXT,                '2026-02-10T09:25:53Z'::TIMESTAMPTZ)
  ) AS v(symbol, shares, purchase_price, purchase_date, memo, created_at)
  ON (s.symbol = v.symbol)
  RETURNING id
),

-- ⑥ stock_events（決算日・株主総会）
events AS (
  INSERT INTO stock_events (id, stock_id, event_type, event_date, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, v.event_type::"EventType", v.event_date::DATE, NOW(), NOW()
  FROM stk s
  JOIN (VALUES
    -- 決算日
    ('5527', 'EARNINGS',             '2026-04-10'),
    ('3093', 'EARNINGS',             '2026-04-15'),
    ('5027', 'EARNINGS',             '2026-02-13'),
    ('3993', 'EARNINGS',             '2026-02-16'),
    ('2980', 'EARNINGS',             '2026-05-13'),
    -- 株主総会
    ('3093', 'SHAREHOLDER_MEETING',  '2026-02-03'),
    ('5527', 'SHAREHOLDER_MEETING',  '2026-02-26')
  ) AS v(symbol, event_type, event_date)
  ON (s.symbol = v.symbol)
  RETURNING id
),

-- ⑦ stock_dividends（配当情報）
dividends AS (
  INSERT INTO stock_dividends (id, stock_id, dividend_per_share, frequency, rights_month, rights_day, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, v.per_share, v.frequency, v.r_month, v.r_day, NOW(), NOW()
  FROM stk s
  JOIN (VALUES
    ('3093', 40::DECIMAL,  1, 2,  28),
    ('5027', 2::DECIMAL,   1, 12, 31),
    ('5527', 25::DECIMAL,  1, 11, 30)  -- 11月は30日まで
  ) AS v(symbol, per_share, frequency, r_month, r_day)
  ON (s.symbol = v.symbol)
  ON CONFLICT (stock_id) DO UPDATE SET
    dividend_per_share = EXCLUDED.dividend_per_share,
    rights_month = EXCLUDED.rights_month,
    rights_day = EXCLUDED.rights_day,
    updated_at = NOW()
  RETURNING id
),

-- ⑧ stock_benefits（株主優待）
benefits AS (
  INSERT INTO stock_benefits (id, stock_id, description, minimum_shares, estimated_value, rights_month, rights_day, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, v.description, v.min_shares, v.est_value, v.r_month, v.r_day, NOW(), NOW()
  FROM stk s
  JOIN (VALUES
    ('3093', 'トレジャーポイント',    400, 2000::DECIMAL, 2,  28),
    ('5527', 'Quoカード5000円分',     300, 5000::DECIMAL, 11, 30)  -- 11月は30日まで
  ) AS v(symbol, description, min_shares, est_value, r_month, r_day)
  ON (s.symbol = v.symbol)
  ON CONFLICT (stock_id) DO UPDATE SET
    description    = EXCLUDED.description,
    minimum_shares = EXCLUDED.minimum_shares,
    estimated_value = EXCLUDED.estimated_value,
    rights_month   = EXCLUDED.rights_month,
    rights_day     = EXCLUDED.rights_day,
    updated_at = NOW()
  RETURNING id
),

-- ⑨ stock_tags（タグ）
tags AS (
  INSERT INTO stock_tags (id, stock_id, name, color, created_at)
  SELECT gen_random_uuid(), s.id, v.name, v.color, NOW()
  FROM stk s
  JOIN (VALUES
    ('3093', '安定',    'blue'),
    ('5027', 'グロース', 'green'),
    ('5527', 'グロース', 'green')
  ) AS v(symbol, name, color)
  ON (s.symbol = v.symbol)
  ON CONFLICT (stock_id, name) DO NOTHING
  RETURNING id
),

-- ⑩ next_action_plans（次の一手 - デフォルト値）
nap AS (
  INSERT INTO next_action_plans (id, stock_id, action_type, priority, target_price, target_shares, strategy_memo, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, 'BUY'::"ActionType", 'MEDIUM'::"Priority", NULL, NULL, '', NOW(), NOW()
  FROM stk s
  WHERE s.symbol IN ('3093', '3993', '4425', '5027', '5527')
  ON CONFLICT (stock_id) DO NOTHING
  RETURNING id
),

-- ⑪ favorite_groups（お気に入りグループ）
fav AS (
  INSERT INTO favorite_groups (id, user_id, name, color, "order", created_at, updated_at)
  VALUES
    (gen_random_uuid(), '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5', '保有中', 'green',  0, NOW(), NOW()),
    (gen_random_uuid(), '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5', '注目株', 'yellow', 1, NOW(), NOW())
  ON CONFLICT (user_id, name) DO UPDATE SET
    color = EXCLUDED.color,
    "order" = EXCLUDED."order",
    updated_at = NOW()
  RETURNING id, name
),

-- ⑫ stock_tab_states（タブ状態）
tabs AS (
  INSERT INTO stock_tab_states (id, stock_id, tab_type, current_tab, created_at, updated_at)
  SELECT gen_random_uuid(), s.id, 'main', v.current_tab, NOW(), NOW()
  FROM stk s
  JOIN (VALUES
    ('2980', 'analysis'),
    ('3093', 'analysis'),
    ('3993', 'analysis'),
    ('4425', 'basic'),
    ('5027', 'basic'),
    ('5527', 'analysis')
  ) AS v(symbol, current_tab)
  ON (s.symbol = v.symbol)
  ON CONFLICT (stock_id, tab_type) DO UPDATE SET
    current_tab = EXCLUDED.current_tab,
    updated_at = NOW()
  RETURNING id
)

-- 結果確認
SELECT
  (SELECT COUNT(*) FROM stk)       AS stocks_inserted,
  (SELECT COUNT(*) FROM memos)     AS memos_inserted,
  (SELECT COUNT(*) FROM prices)    AS prices_inserted,
  (SELECT COUNT(*) FROM positions) AS positions_inserted,
  (SELECT COUNT(*) FROM events)    AS events_inserted,
  (SELECT COUNT(*) FROM dividends) AS dividends_inserted,
  (SELECT COUNT(*) FROM benefits)  AS benefits_inserted,
  (SELECT COUNT(*) FROM tags)      AS tags_inserted,
  (SELECT COUNT(*) FROM nap)       AS nextaction_inserted,
  (SELECT COUNT(*) FROM fav)       AS groups_inserted,
  (SELECT COUNT(*) FROM tabs)      AS tabstates_inserted;
