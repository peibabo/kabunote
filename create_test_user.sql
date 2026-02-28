-- テストユーザーを作成
-- これらのSQLをSupabase SQLエディターで実行してください

-- テストユーザーの作成（重複を避けるため）
INSERT INTO app_users (
    id,
    email,
    name,
    picture,
    auth_provider,
    cash_amount,
    next_action_memo,
    created_at,
    updated_at
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'test@kabunote.dev',
    'Test User',
    null,
    'test',
    1000000,
    '',
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    cash_amount = EXCLUDED.cash_amount,
    next_action_memo = EXCLUDED.next_action_memo,
    updated_at = NOW();

-- 確認用クエリ
SELECT id, email, name, cash_amount, next_action_memo FROM app_users WHERE id = '550e8400-e29b-41d4-a716-446655440000';