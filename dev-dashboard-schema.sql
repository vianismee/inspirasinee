-- Development Schema Setup for Customer Dashboard
-- This script creates the necessary tables in the 'dev' schema for development environment

-- First, ensure the dev schema exists
CREATE SCHEMA IF NOT EXISTS dev;

-- Set search path to dev schema for this session
SET search_path TO dev, public;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create dashboard_sessions table in dev schema
CREATE TABLE IF NOT EXISTS dev.dashboard_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash VARCHAR(12) UNIQUE NOT NULL,
  phone VARCHAR(20) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  dashboard_session_expires TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  used BOOLEAN DEFAULT FALSE,
  accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_access_logs table in dev schema
CREATE TABLE IF NOT EXISTS dev.dashboard_access_logs (
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

-- Create indexes for dashboard_sessions (dev schema)
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_sessions_hash ON dev.dashboard_sessions(hash);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_sessions_phone ON dev.dashboard_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_sessions_expires_at ON dev.dashboard_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_sessions_used ON dev.dashboard_sessions(used);

-- Create indexes for dashboard_access_logs (dev schema)
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_phone ON dev.dashboard_access_logs(phone);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_hash ON dev.dashboard_access_logs(hash);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_ip_address ON dev.dashboard_access_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_action ON dev.dashboard_access_logs(action);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_created_at ON dev.dashboard_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dev_dashboard_access_logs_success ON dev.dashboard_access_logs(success);

-- Add RLS (Row Level Security) for dev schema
ALTER TABLE dev.dashboard_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE dev.dashboard_access_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for dashboard_sessions (dev schema)
DROP POLICY IF EXISTS "Users can access their own sessions" ON dev.dashboard_sessions;
DROP POLICY IF EXISTS "Allow API access to dashboard_sessions" ON dev.dashboard_sessions;

CREATE POLICY "Users can access their own sessions" ON dev.dashboard_sessions
  FOR ALL USING (true);

CREATE POLICY "Allow API access to dashboard_sessions" ON dev.dashboard_sessions
  FOR ALL USING (true);

-- Create policies for dashboard_access_logs (dev schema)
DROP POLICY IF EXISTS "Allow API access to dashboard_access_logs" ON dev.dashboard_access_logs;
DROP POLICY IF EXISTS "Admins can view all access logs" ON dev.dashboard_access_logs;

CREATE POLICY "Allow API access to dashboard_access_logs" ON dev.dashboard_access_logs
  FOR ALL USING (true);

CREATE POLICY "Admins can view all access logs" ON dev.dashboard_access_logs
  FOR SELECT USING (true);

-- Create trigger function for updated_at (dev schema)
CREATE OR REPLACE FUNCTION dev.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for dashboard_sessions (dev schema)
DROP TRIGGER IF EXISTS update_dev_dashboard_sessions_updated_at ON dev.dashboard_sessions;
CREATE TRIGGER update_dev_dashboard_sessions_updated_at
  BEFORE UPDATE ON dev.dashboard_sessions
  FOR EACH ROW EXECUTE FUNCTION dev.update_updated_at_column();

-- Reset search path
RESET search_path;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Development schema setup completed successfully!';
  RAISE NOTICE '📋 Tables created: dev.dashboard_sessions, dev.dashboard_access_logs';
  RAISE NOTICE '🔒 RLS enabled and policies created';
  RAISE NOTICE '📊 Indexes created for performance';
END $$;