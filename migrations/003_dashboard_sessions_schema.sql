-- Migration: Dashboard Sessions Schema for Public Schema
-- This migration creates dashboard session and access log tables in public schema
-- Based on dev-dashboard-schema.sql and extand-dashboard-schema.sql
-- Run this after the main schema migrations

-- =====================================================
-- STEP 1: Enable UUID Extension
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STEP 2: Create Dashboard Sessions Tables
-- =====================================================

-- Create dashboard_sessions table in public schema
CREATE TABLE IF NOT EXISTS public.dashboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash VARCHAR(12) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  dashboard_session_expires TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  ip_address VARCHAR(45),
  user_agent TEXT,
  used BOOLEAN DEFAULT FALSE,
  accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_access_logs table in public schema
CREATE TABLE IF NOT EXISTS public.dashboard_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20),
  hash VARCHAR(12),
  ip_address VARCHAR(45),
  user_agent TEXT,
  action VARCHAR(50) NOT NULL,
  success BOOLEAN NOT NULL,
  error_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: Create Performance Indexes
-- =====================================================

-- Create indexes for dashboard_sessions
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_hash ON public.dashboard_sessions(hash);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_phone ON public.dashboard_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_expires_at ON public.dashboard_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_dashboard_expires ON public.dashboard_sessions(dashboard_session_expires);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_used ON public.dashboard_sessions(used);
CREATE INDEX IF NOT EXISTS idx_dashboard_sessions_created_at ON public.dashboard_sessions(created_at);

-- Create indexes for dashboard_access_logs
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_phone ON public.dashboard_access_logs(phone);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_hash ON public.dashboard_access_logs(hash);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_ip_address ON public.dashboard_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_action ON public.dashboard_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_created_at ON public.dashboard_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_access_logs_success ON public.dashboard_access_logs(success);

-- =====================================================
-- STEP 4: Data Migration (uncomment if you have data to migrate)
-- =====================================================

/*
-- Migrate dashboard_sessions data from dev schema
INSERT INTO public.dashboard_sessions (
  id, hash, phone, expires_at, dashboard_session_expires, ip_address,
  user_agent, used, accessed_at, access_count, created_at, updated_at
)
SELECT
  id, hash, phone, expires_at, dashboard_session_expires, ip_address,
  user_agent, used, accessed_at, access_count, created_at, updated_at
FROM dev.dashboard_sessions
ON CONFLICT (id) DO NOTHING;

-- Migrate dashboard_access_logs data from dev schema
INSERT INTO public.dashboard_access_logs (
  id, phone, hash, ip_address, user_agent, action, success, error_reason, created_at
)
SELECT
  id, phone, hash, ip_address, user_agent, action, success, error_reason, created_at
FROM dev.dashboard_access_logs
ON CONFLICT (id) DO NOTHING;
*/

-- =====================================================
-- STEP 5: Create Trigger Functions
-- =====================================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_dashboard_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for dashboard_sessions
DROP TRIGGER IF EXISTS update_dashboard_sessions_updated_at ON public.dashboard_sessions;
CREATE TRIGGER update_dashboard_sessions_updated_at
  BEFORE UPDATE ON public.dashboard_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_dashboard_updated_at_column();

-- =====================================================
-- STEP 6: Row Level Security (RLS) Setup
-- =====================================================

-- Enable RLS on dashboard tables
ALTER TABLE public.dashboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard_access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_sessions
DROP POLICY IF EXISTS "Users can access their own sessions" ON public.dashboard_sessions;
DROP POLICY IF EXISTS "Allow API access to dashboard_sessions" ON public.dashboard_sessions;

-- Allow all access for API functionality (adjust as needed for security)
CREATE POLICY "Allow API access to dashboard_sessions" ON public.dashboard_sessions
  FOR ALL USING (true);

-- Create policies for dashboard_access_logs
DROP POLICY IF EXISTS "Allow API access to dashboard_access_logs" ON public.dashboard_access_logs;
DROP POLICY IF EXISTS "Admins can view all access logs" ON public.dashboard_access_logs;

-- Allow all access for API functionality (adjust as needed for security)
CREATE POLICY "Allow API access to dashboard_access_logs" ON public.dashboard_access_logs
  FOR ALL USING (true);

-- =====================================================
-- STEP 7: Create Helper Functions
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_dashboard_sessions()
RETURNS TABLE(
  deleted_sessions_count bigint,
  deleted_logs_count bigint
) AS $$
DECLARE
  v_deleted_sessions bigint;
  v_deleted_logs bigint;
BEGIN
  -- Delete expired dashboard sessions
  DELETE FROM public.dashboard_sessions
  WHERE expires_at < NOW() OR dashboard_session_expires < NOW();

  GET DIAGNOSTICS v_deleted_sessions = ROW_COUNT;

  -- Optionally clean up old access logs (older than 30 days)
  DELETE FROM public.dashboard_access_logs
  WHERE created_at < NOW() - INTERVAL '30 days';

  GET DIAGNOSTICS v_deleted_logs = ROW_COUNT;

  RETURN QUERY SELECT v_deleted_sessions, v_deleted_logs;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active dashboard session statistics
CREATE OR REPLACE FUNCTION public.get_dashboard_session_stats()
RETURNS TABLE(
  total_sessions bigint,
  active_sessions bigint,
  used_sessions bigint,
  expired_sessions bigint,
  total_access_logs bigint,
  successful_accesses bigint,
  failed_accesses bigint,
  average_session_duration_hours numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.dashboard_sessions) as total_sessions,
    (SELECT COUNT(*) FROM public.dashboard_sessions
     WHERE expires_at > NOW() AND dashboard_session_expires > NOW()) as active_sessions,
    (SELECT COUNT(*) FROM public.dashboard_sessions WHERE used = TRUE) as used_sessions,
    (SELECT COUNT(*) FROM public.dashboard_sessions
     WHERE expires_at < NOW() OR dashboard_session_expires < NOW()) as expired_sessions,
    (SELECT COUNT(*) FROM public.dashboard_access_logs) as total_access_logs,
    (SELECT COUNT(*) FROM public.dashboard_access_logs WHERE success = TRUE) as successful_accesses,
    (SELECT COUNT(*) FROM public.dashboard_access_logs WHERE success = FALSE) as failed_accesses,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (dashboard_session_expires - created_at)) / 3600)
       FROM public.dashboard_sessions
       WHERE used = TRUE AND dashboard_session_expires IS NOT NULL), 0
    ) as average_session_duration_hours;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create new dashboard session
CREATE OR REPLACE FUNCTION public.create_dashboard_session(
  p_hash VARCHAR(12),
  p_phone VARCHAR(20),
  p_ip_address VARCHAR(45) DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_link_expiry_hours INTEGER DEFAULT 1,
  p_session_expiry_hours INTEGER DEFAULT 24
)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO public.dashboard_sessions (
    hash, phone, ip_address, user_agent,
    expires_at, dashboard_session_expires
  ) VALUES (
    p_hash, p_phone, p_ip_address, p_user_agent,
    NOW() + INTERVAL '1 hour' * p_link_expiry_hours,
    NOW() + INTERVAL '1 hour' * p_session_expiry_hours
  ) RETURNING id INTO v_session_id;

  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 8: Grant Permissions
-- =====================================================

-- Grant permissions on tables
GRANT SELECT, INSERT, UPDATE ON public.dashboard_sessions TO authenticated, anon;
GRANT SELECT, INSERT ON public.dashboard_access_logs TO authenticated, anon;

-- Grant permissions on sequences (if any)
-- GRANT USAGE, SELECT ON SEQUENCE public.dashboard_sessions_id_seq TO authenticated, anon;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.cleanup_expired_dashboard_sessions() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_session_stats() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_dashboard_session(
  VARCHAR(12), VARCHAR(20), VARCHAR(45), TEXT, INTEGER, INTEGER
) TO authenticated, anon;

-- =====================================================
-- Migration Complete
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Dashboard sessions schema migration completed successfully!';
  RAISE NOTICE '📋 Tables created: public.dashboard_sessions, public.dashboard_access_logs';
  RAISE NOTICE '🔒 RLS enabled and policies created';
  RAISE NOTICE '📊 Performance indexes created';
  RAISE NOTICE '🔧 Helper functions created for session management';
  RAISE NOTICE '⏰ Session settings: Link expires: 1 hour, Dashboard session: 24 hours';
  RAISE NOTICE '🚨 Remember to update application code to use public schema';
END $$;

-- Notes:
-- 1. This migration creates dashboard session tables in the public schema
-- 2. Includes both link expiry (1 hour default) and session expiry (24 hours default)
-- 3. Comprehensive indexing for performance
-- 4. Helper functions for session management and cleanup
-- 5. RLS policies can be adjusted based on security requirements
-- 6. Uncomment data migration section if migrating existing data from dev schema