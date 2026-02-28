-- 不足しているEnumタイプを作成
-- これらのSQLをSupabase SQLエディターで実行してください

-- ActionType enum作成
DO $$ BEGIN
    CREATE TYPE "ActionType" AS ENUM ('BUY', 'SELL', 'HOLD');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Priority enum作成
DO $$ BEGIN
    CREATE TYPE "Priority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlertType enum作成
DO $$ BEGIN
    CREATE TYPE "AlertType" AS ENUM (
        'FUND_SHORTAGE',
        'STOP_LOSS_EXCEEDED',
        'NEXT_ACTION_URGENT',
        'STOP_LOSS_APPROACHING',
        'PROFIT_TARGET_APPROACHING',
        'NEXT_ACTION_WARNING'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- EventType enum作成
DO $$ BEGIN
    CREATE TYPE "EventType" AS ENUM ('EARNINGS', 'SHAREHOLDER_MEETING');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;