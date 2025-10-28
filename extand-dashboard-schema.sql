-- Add dashboard_session_expires column to dev schema table
-- This script adds the new column for longer dashboard sessions (DEVELOPMENT ONLY)

-- For development schema only
DO $$
BEGIN
    -- Check if the column exists in dev schema
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'dev'
        AND table_name = 'dashboard_sessions'
        AND column_name = 'dashboard_session_expires'
    ) THEN
        -- Add column to dev schema
        ALTER TABLE dev.dashboard_sessions
        ADD COLUMN dashboard_session_expires TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours');

        RAISE NOTICE '✅ Added dashboard_session_expires column to dev.dashboard_sessions';
    ELSE
        RAISE NOTICE 'ℹ️ dashboard_session_expires column already exists in dev.dashboard_sessions';
    END IF;
END $$;

-- Update indexes to include the new column (optional for performance)
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_sessions_dashboard_expires ON dev.dashboard_sessions(dashboard_session_expires);

DO $$
BEGIN
    RAISE NOTICE '🎉 Development session expiry update completed successfully!';
    RAISE NOTICE '📋 Added dashboard_session_expires column with 24-hour default';
    RAISE NOTICE '🔗 Link expires: 1 hour (for initial access)';
    RAISE NOTICE '📱 Dashboard session expires: 24 hours (for continued access)';
    RAISE NOTICE '🚨 Public schema migration SKIPPED (as requested)';
END $$;