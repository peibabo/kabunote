-- ============================================================
-- 過去データインポート: localStorage → Supabase DB
-- エクスポート日: 2026-02-26
-- 対象銘柄: 5527, 3093, 5027, 4425, 3993, 2980
-- ============================================================
-- 実行場所: Supabase Dashboard > SQL Editor
-- 注意: app_users に既にログイン済みユーザーが存在する前提です
-- ============================================================

-- ▼ 事前確認: どのユーザーが対象か確認してください
SELECT id, email, name, created_at FROM app_users;

-- ============================================================
-- メインインポート処理
-- ============================================================
DO $$
DECLARE
    v_user_id       TEXT;
    v_5527          TEXT;
    v_3093          TEXT;
    v_5027          TEXT;
    v_4425          TEXT;
    v_3993          TEXT;
    v_2980          TEXT;
    v_group_保有中  TEXT;
    v_group_注目株  TEXT;
BEGIN

    -- =========================================
    -- ユーザーID取得
    -- ※ 複数ユーザーがいる場合は email で絞り込む:
    --   WHERE email = 'your@email.com'
    -- =========================================
    SELECT id INTO v_user_id FROM app_users LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '❌ app_users にユーザーが見つかりません。先にアプリにログインしてください。';
    END IF;

    RAISE NOTICE '✅ 対象ユーザーID: %', v_user_id;


    -- =========================================
    -- 銘柄 (stocks)
    -- 表示順: 5527(0), 3093(1), 5027(2), 4425(3), 3993(4), 2980(5)
    -- =========================================
    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '5527', 0, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_5527;

    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '3093', 1, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_3093;

    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '5027', 2, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_5027;

    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '4425', 3, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_4425;

    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '3993', 4, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_3993;

    INSERT INTO stocks (id, user_id, symbol, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '2980', 5, now(), now())
    ON CONFLICT (user_id, symbol) DO UPDATE SET "order" = EXCLUDED."order", updated_at = now()
    RETURNING id INTO v_2980;

    RAISE NOTICE '✅ 銘柄6件: 5527=%, 3093=%, 5027=%, 4425=%, 3993=%, 2980=%',
        v_5527, v_3093, v_5027, v_4425, v_3993, v_2980;


    -- =========================================
    -- メモ (stock_memos)
    -- 3093: トレファクへのメモ
    -- 4425: Kudan分析メモ
    -- =========================================
    INSERT INTO stock_memos (id, stock_id, content, created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_3093,
        '爆発力が無いので長期的に持つか。
でも景気が良くなってくるとリユース熱が下がると思うので、良きところで売却しよう。',
        now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

    INSERT INTO stock_memos (id, stock_id, content, created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_4425,
        E'なぜ\u300cKudan\u300dなのか？（戦略的理由）\n現在のあなたの保有銘柄は、実は以下のような性格を持っています。\n\nProperty (5527): 国内・不動産・安定成長（守りの主砲）\n\nトレファク (3093): 国内・リユース・業績確実（利益の源泉）\n\nAnyMind (5027): アジア・EC・高成長（期待の加速装置）\n\nここに**\u300cハーモニック\u300d**を加えると、製造業・大型株寄りの性格が強まり、ポートフォリオが少し\u300c重く\u300dなります。2倍を狙うには、もう一歩\u300c爆発力\u300dが足りません。\n\n一方で**\u300cKudan\u300d**を加えると：\n\nAI×ロボティクスという\u300c旬\u300dのテーマを直接取り込める。\n\nAnyMindと同じく\u300c市場に正当に評価されていない（赤字から黒字への転換点）\u300dという、あなたが最も得意とする\u300c歪み\u300dのある銘柄である。\n\nソフトウェアライセンス型なので、当たった時の利益率がハーモニック（製造業）より遥かに高く、1年で2倍を狙うスピード感に合致する。\n\n2. リスク管理：210万円の使い分け\nプロとして、Kudanに全額突っ込むことは推奨しません。今のあなたの最強の武器である\u300c210万円\u300dをこう使い分けるのが\u300c2倍への最短ルート\u300dです。\n\n【攻め】Kudanに50万円〜70万円:\n\u300cAI×ロボティクス\u300d枠として新規採用。今のポートフォリオに欠けている\u300cハイテク・ディープテック\u300dの爆発力を補完します。\n\n【守り・追撃】AnyMindに50万円:\n500円奪還時に買い増しして平均単価を下げる用。これでAnyMindの復活を加速させます。\n\n【リザーブ】残り約100万円:\nProperty社が\u300c2倍\u300dに向けて動き出した時の追撃、あるいは予期せぬチャンス（暴落）への備えとして。\n\n3. プロの懸念とアドバイス\nKudanは、今のAnyMind以上にボラティリティ（値動き）が激しいです。\n\nProperty社のような安定感はありません。\n\nトレファクのような分かりやすい利益も、まだこれからです。\n\nしかし、**\u300c誰もが確信を持っていない時期に、技術の価値を信じて仕込む\u300d**のがテンバガー（10倍株）や2倍株を掴むプロの作法です。\n\n💡 最終結論\n今のポートフォリオのバランスを考え、かつ\u300c1年で2倍\u300dという野心的な目標を最速で達成したいのであれば、Kudanを選び、\u300cAI・空間知覚\u300dという未来に賭けるのが正解です。\n\nハーモニックは素晴らしい企業ですが、今のあなたが必要としている\u300c資産を急加速させるための劇薬\u300dとしては、Kudanの方が相応しいでしょう。',
        now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now();

    RAISE NOTICE '✅ メモ2件挿入完了';


    -- =========================================
    -- タグ (stock_tags)
    -- 3093: 安定(blue) / 5027: グロース(green) / 5527: グロース(green)
    -- =========================================
    INSERT INTO stock_tags (id, stock_id, name, color, created_at) VALUES
        (gen_random_uuid()::text, v_3093, '安定',    'blue',  now()),
        (gen_random_uuid()::text, v_5027, 'グロース', 'green', now()),
        (gen_random_uuid()::text, v_5527, 'グロース', 'green', now())
    ON CONFLICT (stock_id, name) DO NOTHING;

    RAISE NOTICE '✅ タグ3件挿入完了';


    -- =========================================
    -- 株価情報 (stock_prices)
    -- current_price / target_price / stop_loss_price
    -- 3993・2980 は価格未設定 → NULL
    -- =========================================
    INSERT INTO stock_prices (id, stock_id, current_price, target_price, stop_loss_price, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_3093, 1849,  2150, 1680, now(), now()),
        (gen_random_uuid()::text, v_4425, 2100,  2500, 1900, now(), now()),
        (gen_random_uuid()::text, v_5027,  478,  1000,  450, now(), now()),
        (gen_random_uuid()::text, v_5527,  744,  1400,  650, now(), now()),
        (gen_random_uuid()::text, v_3993, NULL,  NULL,  NULL, now(), now()),
        (gen_random_uuid()::text, v_2980, NULL,  NULL,  NULL, now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET
        current_price   = EXCLUDED.current_price,
        target_price    = EXCLUDED.target_price,
        stop_loss_price = EXCLUDED.stop_loss_price,
        updated_at      = now();

    RAISE NOTICE '✅ 株価情報6件挿入完了';


    -- =========================================
    -- 保有ポジション (stock_positions)
    -- 複数レコード設計: 購入ロットごとに1行
    --
    -- 3093: 500株 @1826.07円 (2026-01-15)
    -- 4425: 500株 @2121.28円 (2026-02-26)
    -- 5027: 1500株 @556.95円 (2026-02-16) ← ロット1
    -- 5027: 1000株 @523.48円 (2026-02-26) ← ロット2
    -- 5527: 1800株 @822.88円 (2025-12-01) ← ロット1
    -- 5527: 2500株 @769.30円 (2026-01-10) ← ロット2
    -- =========================================
    INSERT INTO stock_positions (id, stock_id, shares, purchase_price, purchase_date, memo, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_3093, 500,  1826.07, '2026-01-15', 'geminiに勧められた',         '2026-02-10 09:24:54+00', now()),
        (gen_random_uuid()::text, v_4425, 500,  2121.28, '2026-02-26', NULL,                          '2026-02-26 03:29:19+00', now()),
        (gen_random_uuid()::text, v_5027, 1500,  556.95, '2026-02-16', '決算後のパニック売りを拾った', '2026-02-16 00:58:54+00', now()),
        (gen_random_uuid()::text, v_5027, 1000,  523.48, '2026-02-26', NULL,                          '2026-02-26 05:40:55+00', now()),
        (gen_random_uuid()::text, v_5527, 1800,  822.88, '2025-12-01', NULL,                          '2026-02-10 09:25:33+00', now()),
        (gen_random_uuid()::text, v_5527, 2500,  769.30, '2026-01-10', NULL,                          '2026-02-10 09:25:53+00', now());

    RAISE NOTICE '✅ ポジション6件挿入完了（5027×2ロット, 5527×2ロット）';


    -- =========================================
    -- 決算・株主総会イベント (stock_events)
    --
    -- [決算発表日 EARNINGS]
    --   2980: 2026-05-13
    --   3093: 2026-04-15
    --   3993: 2026-02-16
    --   5027: 2026-02-13
    --   5527: 2026-04-10
    --
    -- [株主総会 SHAREHOLDER_MEETING] isActive=true のもののみ
    --   3093: 2026-02-03
    --   5527: 2026-02-26
    -- =========================================
    INSERT INTO stock_events (id, stock_id, event_type, event_date, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_2980, 'EARNINGS',            '2026-05-13 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_3093, 'EARNINGS',            '2026-04-15 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_3993, 'EARNINGS',            '2026-02-16 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_5027, 'EARNINGS',            '2026-02-13 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_5527, 'EARNINGS',            '2026-04-10 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_3093, 'SHAREHOLDER_MEETING', '2026-02-03 00:00:00+00', now(), now()),
        (gen_random_uuid()::text, v_5527, 'SHAREHOLDER_MEETING', '2026-02-26 00:00:00+00', now(), now());

    RAISE NOTICE '✅ イベント7件挿入完了（決算5件・株主総会2件）';


    -- =========================================
    -- 配当情報 (stock_dividends)
    -- 3093: 40円/株 / 2月28日権利確定
    -- 5027:  2円/株 / 12月31日権利確定
    -- 5527: 25円/株 / 11月30日権利確定
    --   ※ 元データの11月31日は存在しないため30日に修正
    -- =========================================
    INSERT INTO stock_dividends (id, stock_id, dividend_per_share, frequency, rights_month, rights_day, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_3093, 40, 1,  2, 28, now(), now()),
        (gen_random_uuid()::text, v_5027,  2, 1, 12, 31, now(), now()),
        (gen_random_uuid()::text, v_5527, 25, 1, 11, 30, now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET
        dividend_per_share = EXCLUDED.dividend_per_share,
        frequency          = EXCLUDED.frequency,
        rights_month       = EXCLUDED.rights_month,
        rights_day         = EXCLUDED.rights_day,
        updated_at         = now();

    RAISE NOTICE '✅ 配当情報3件挿入完了';


    -- =========================================
    -- 株主優待情報 (stock_benefits)
    -- 3093: トレジャーポイント / 400株以上 / 推定2,000円
    -- 5527: Quoカード5000円分 / 300株以上 / 推定5,000円
    --   ※ 権利確定日は shareholderRightsSettings の値を使用
    --   ※ 11月31日 → 30日に修正
    -- =========================================
    INSERT INTO stock_benefits (id, stock_id, description, minimum_shares, estimated_value, rights_month, rights_day, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_3093, 'トレジャーポイント',  400, 2000,  2, 28, now(), now()),
        (gen_random_uuid()::text, v_5527, 'Quoカード5000円分', 300, 5000, 11, 30, now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET
        description    = EXCLUDED.description,
        minimum_shares = EXCLUDED.minimum_shares,
        estimated_value = EXCLUDED.estimated_value,
        rights_month   = EXCLUDED.rights_month,
        rights_day     = EXCLUDED.rights_day,
        updated_at     = now();

    RAISE NOTICE '✅ 株主優待2件挿入完了';


    -- =========================================
    -- 次の一手戦略 (next_action_plans)
    -- 元データは targetPrice=0, targetQuantity=0 のため NULL で保存
    -- actionType: buy → BUY / priority: medium → MEDIUM
    -- =========================================
    INSERT INTO next_action_plans (id, stock_id, action_type, priority, target_price, target_shares, strategy_memo, created_at, updated_at) VALUES
        (gen_random_uuid()::text, v_3093, 'BUY', 'MEDIUM', NULL, NULL, NULL, now(), now()),
        (gen_random_uuid()::text, v_3993, 'BUY', 'MEDIUM', NULL, NULL, NULL, now(), now()),
        (gen_random_uuid()::text, v_4425, 'BUY', 'MEDIUM', NULL, NULL, NULL, now(), now()),
        (gen_random_uuid()::text, v_5027, 'BUY', 'MEDIUM', NULL, NULL, NULL, now(), now()),
        (gen_random_uuid()::text, v_5527, 'BUY', 'MEDIUM', NULL, NULL, NULL, now(), now())
    ON CONFLICT (stock_id) DO UPDATE SET
        action_type  = EXCLUDED.action_type,
        priority     = EXCLUDED.priority,
        updated_at   = now();

    RAISE NOTICE '✅ 次の一手5件挿入完了';


    -- =========================================
    -- お気に入りグループ (favorite_groups)
    -- 「保有中」(green): 3093, 5527, 5027, 4425
    -- 「注目株」(yellow): 3993, 2980
    -- =========================================
    INSERT INTO favorite_groups (id, user_id, name, color, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '保有中', 'green', 0, now(), now())
    ON CONFLICT (user_id, name) DO UPDATE SET
        color      = EXCLUDED.color,
        "order"    = EXCLUDED."order",
        updated_at = now()
    RETURNING id INTO v_group_保有中;

    INSERT INTO favorite_groups (id, user_id, name, color, "order", created_at, updated_at)
    VALUES (gen_random_uuid()::text, v_user_id, '注目株', 'yellow', 1, now(), now())
    ON CONFLICT (user_id, name) DO UPDATE SET
        color      = EXCLUDED.color,
        "order"    = EXCLUDED."order",
        updated_at = now()
    RETURNING id INTO v_group_注目株;

    RAISE NOTICE '✅ グループ2件挿入完了';


    -- =========================================
    -- グループ銘柄紐付け (stock_favorite_groups)
    -- 「保有中」: 3093, 5527, 5027, 4425
    -- 「注目株」: 3993, 2980
    -- =========================================
    INSERT INTO stock_favorite_groups (id, stock_id, group_id) VALUES
        (gen_random_uuid()::text, v_3093, v_group_保有中),
        (gen_random_uuid()::text, v_5527, v_group_保有中),
        (gen_random_uuid()::text, v_5027, v_group_保有中),
        (gen_random_uuid()::text, v_4425, v_group_保有中),
        (gen_random_uuid()::text, v_3993, v_group_注目株),
        (gen_random_uuid()::text, v_2980, v_group_注目株)
    ON CONFLICT (stock_id, group_id) DO NOTHING;

    RAISE NOTICE '✅ グループ銘柄紐付け6件挿入完了';


    -- =========================================
    -- ユーザー設定更新 (app_users)
    -- 現金残高: 450,000円
    -- Next Action メモ
    -- =========================================
    UPDATE app_users
    SET
        cash_amount      = 450000,
        next_action_memo = 'この現金は何に使うか考え中（UFJ45万円）',
        updated_at       = now()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ ユーザー設定更新完了（現金450,000円）';


    -- =========================================
    -- 完了サマリー
    -- =========================================
    RAISE NOTICE '';
    RAISE NOTICE '🎉 全データのインポートが完了しました！';
    RAISE NOTICE '   銘柄      : 6件 (5527, 3093, 5027, 4425, 3993, 2980)';
    RAISE NOTICE '   メモ      : 2件 (3093, 4425)';
    RAISE NOTICE '   タグ      : 3件 (3093:安定, 5027:グロース, 5527:グロース)';
    RAISE NOTICE '   株価情報  : 6件';
    RAISE NOTICE '   ポジション: 6件 (5027×2ロット, 5527×2ロット, 3093×1, 4425×1)';
    RAISE NOTICE '   イベント  : 7件 (決算5件 + 株主総会2件)';
    RAISE NOTICE '   配当情報  : 3件 (3093, 5027, 5527)';
    RAISE NOTICE '   株主優待  : 2件 (3093, 5527)';
    RAISE NOTICE '   次の一手  : 5件';
    RAISE NOTICE '   グループ  : 2件 (保有中, 注目株)';
    RAISE NOTICE '   グループ紐付け: 6件 (保有中×4, 注目株×2)';
    RAISE NOTICE '   現金残高  : 450,000円';

END $$;


-- ============================================================
-- ▼ 実行後の確認クエリ（任意）
-- ============================================================

-- 銘柄一覧
SELECT s.symbol, s.order, sp.current_price, sp.target_price, sp.stop_loss_price
FROM stocks s
LEFT JOIN stock_prices sp ON sp.stock_id = s.id
ORDER BY s."order";

-- ポジション確認（平均取得価額も計算）
SELECT
    s.symbol,
    COUNT(pos.id)                                   AS lot_count,
    SUM(pos.shares)                                 AS total_shares,
    ROUND(SUM(pos.shares * pos.purchase_price)
          / NULLIF(SUM(pos.shares), 0), 2)           AS avg_price,
    SUM(pos.shares * pos.purchase_price)            AS total_cost
FROM stocks s
JOIN stock_positions pos ON pos.stock_id = s.id
GROUP BY s.symbol
ORDER BY s.symbol;
