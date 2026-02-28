-- usersテーブルの詳細構造を確認
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- cash_amount, next_action_memo列が存在するか確認
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'cash_amount'
) as has_cash_amount,
EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'next_action_memo'
) as has_next_action_memo;