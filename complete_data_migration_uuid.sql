-- 完全データ移行SQL（UUID対応版）
-- fix_data_type_conflict.sql実行後にこちらを実行してください

-- 銘柄データの挿入（UUID型ユーザーIDで）
INSERT INTO stocks (id, user_id, symbol, name, sector, market, "order", created_at, updated_at) VALUES
('stock-5527', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '5527', 'フィット', NULL, NULL, 0, NOW(), NOW()),
('stock-3093', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '3093', 'トレジャー・ファクトリー', NULL, NULL, 1, NOW(), NOW()),
('stock-5027', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '5027', 'AnyMind Group', NULL, NULL, 2, NOW(), NOW()),
('stock-4425', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '4425', 'Kudan', NULL, NULL, 3, NOW(), NOW()),
('stock-3993', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '3993', 'PKSHA Technology', NULL, NULL, 4, NOW(), NOW()),
('stock-2980', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '2980', 'SREホールディングス', NULL, NULL, 5, NOW(), NOW());

-- 株価情報
INSERT INTO stock_prices (id, stock_id, current_price, target_price, stop_loss_price, created_at, updated_at) VALUES
('price-5527', 'stock-5527', 763, 1400, 650, NOW(), NOW()),
('price-3093', 'stock-3093', 1897, 2150, 1680, NOW(), NOW()),
('price-5027', 'stock-5027', 517, 1000, 450, NOW(), NOW()),
('price-4425', 'stock-4425', 2215, 2500, 1900, NOW(), NOW()),
('price-3993', 'stock-3993', NULL, NULL, NULL, NOW(), NOW()),
('price-2980', 'stock-2980', NULL, NULL, NULL, NOW(), NOW());

-- 株式メモ
INSERT INTO stock_memos (id, stock_id, content, created_at, updated_at) VALUES
('memo-4425', 'stock-4425', 'なぜ「Kudan」なのか？（戦略的理由）
現在のあなたの保有銘柄は、実は以下のような性格を持っています。

Property (5527): 国内・不動産・安定成長（守りの主砲）

トレファク (3093): 国内・リユース・業績確実（利益の源泉）

AnyMind (5027): アジア・EC・高成長（期待の加速装置）

ここに**「ハーモニック」**を加えると、製造業・大型株寄りの性格が強まり、ポートフォリオが少し「重く」なります。2倍を狙うには、もう一歩「爆発力」が足りません。

一方で**「Kudan」**を加えると：

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

しかし、**「誰もが確信を持っていない時期に、技術の価値を信じて仕込む」**のがテンバガー（10倍株）や2倍株を掴むプロの作法です。

💡 最終結論
今のポートフォリオのバランスを考え、かつ「1年で2倍」という野心的な目標を最速で達成したいのであれば、Kudanを選び、「AI・空間知覚」という未来に賭けるのが正解です。

ハーモニックは素晴らしい企業ですが、今のあなたが必要としている「資産を急加速させるための劇薬」としては、Kudanの方が相応しいでしょう。', NOW(), NOW()),
('memo-3093', 'stock-3093', '爆発力が無いので長期的に持つか。
でも景気が良くなってくるとリユース熱が下がると思うので、良きところで売却しよう。', NOW(), NOW()),
('memo-5527', 'stock-5527', '', NOW(), NOW());

-- 保有ポジション
INSERT INTO stock_positions (id, stock_id, shares, average_price, total_investment, updated_at) VALUES
('pos-5527', 'stock-5527', 4300, 791.01, 3401343, NOW()),
('pos-3093', 'stock-3093', 500, 1826.07, 913035, NOW()),
('pos-5027', 'stock-5027', 2500, 523.42, 1308550, NOW()),
('pos-4425', 'stock-4425', 500, 2121.28, 1060640, NOW());

-- イベント（決算・株主総会）
INSERT INTO stock_events (id, stock_id, event_type, event_date, created_at, updated_at) VALUES
('event-3093-earnings', 'stock-3093', 'EARNINGS', '2026-04-15', NOW(), NOW()),
('event-5527-earnings', 'stock-5527', 'EARNINGS', '2026-04-10', NOW(), NOW()),
('event-5027-earnings', 'stock-5027', 'EARNINGS', '2026-02-13', NOW(), NOW()),
('event-4425-earnings', 'stock-4425', 'EARNINGS', '2026-05-15', NOW(), NOW()),
('event-3993-earnings', 'stock-3993', 'EARNINGS', '2026-02-16', NOW(), NOW()),
('event-2980-earnings', 'stock-2980', 'EARNINGS', '2026-05-13', NOW(), NOW()),
('event-3093-meeting', 'stock-3093', 'SHAREHOLDER_MEETING', '2026-02-03', NOW(), NOW()),
('event-4425-meeting', 'stock-4425', 'SHAREHOLDER_MEETING', '2026-06-27', NOW(), NOW()),
('event-5527-meeting', 'stock-5527', 'SHAREHOLDER_MEETING', '2026-02-26', NOW(), NOW());

-- 配当情報
INSERT INTO stock_dividends (id, stock_id, dividend_per_share, frequency, rights_month, rights_day, created_at, updated_at) VALUES
('div-5027', 'stock-5027', 2, 1, 12, 31, NOW(), NOW()),
('div-3093', 'stock-3093', 40, 1, 2, 28, NOW(), NOW()),
('div-5527', 'stock-5527', 25, 1, 11, 31, NOW(), NOW());

-- 株主優待情報
INSERT INTO stock_benefits (id, stock_id, description, minimum_shares, estimated_value, rights_month, rights_day, created_at, updated_at) VALUES
('benefit-5527', 'stock-5527', 'Quoカード5000円分', 300, 5000, 11, 31, NOW(), NOW()),
('benefit-3093', 'stock-3093', 'トレジャーポイント', 400, 2000, 2, 28, NOW(), NOW());

-- タグ
INSERT INTO stock_tags (id, stock_id, name, color, created_at) VALUES
('tag-5027-growth', 'stock-5027', 'グロース', 'green', NOW()),
('tag-3093-stable', 'stock-3093', '安定', 'blue', NOW()),
('tag-5527-growth', 'stock-5527', 'グロース', 'green', NOW());

-- Next Action Plan
INSERT INTO next_action_plans (id, stock_id, action_type, priority, target_price, target_shares, strategy_memo, created_at, updated_at) VALUES
('nap-4425', 'stock-4425', 'BUY', 'MEDIUM', NULL, NULL, '', NOW(), NOW()),
('nap-5527', 'stock-5527', 'BUY', 'MEDIUM', NULL, NULL, '', NOW(), NOW()),
('nap-5027', 'stock-5027', 'BUY', 'MEDIUM', NULL, NULL, '', NOW(), NOW()),
('nap-3993', 'stock-3993', 'BUY', 'MEDIUM', NULL, NULL, '', NOW(), NOW()),
('nap-3093', 'stock-3093', 'BUY', 'MEDIUM', NULL, NULL, '', NOW(), NOW());

-- お気に入りグループ（UUID型ユーザーIDで）
INSERT INTO favorite_groups (id, user_id, name, color, "order", created_at, updated_at) VALUES
('group-1', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '保有中', 'green', 0, NOW(), NOW()),
('group-2', '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid, '注目株', 'yellow', 1, NOW(), NOW());

-- 完了確認
SELECT 'データ移行完了！🎉' as status;
SELECT
  s.symbol,
  s.name,
  sp.current_price,
  sp.target_price,
  pos.shares,
  pos.average_price
FROM stocks s
LEFT JOIN stock_prices sp ON s.id = sp.stock_id
LEFT JOIN stock_positions pos ON s.id = pos.stock_id
WHERE s.user_id = '21ca8fd9-20b5-43e7-8eae-7a7c7f8e14b5'::uuid
ORDER BY s."order";