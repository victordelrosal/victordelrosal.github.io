-- VDISIP: Create vigil_intel table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS vigil_intel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_date DATE NOT NULL UNIQUE,
  scan_version TEXT DEFAULT '1.0',
  source_stats JSONB NOT NULL DEFAULT '{}',
  findings JSONB NOT NULL DEFAULT '[]',
  null_signal BOOLEAN DEFAULT false,
  null_reason TEXT,
  deliberated BOOLEAN DEFAULT false,
  deliberated_at TIMESTAMPTZ,
  try_count INTEGER DEFAULT 0,
  watch_count INTEGER DEFAULT 0,
  skip_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for startup hook query (check today's undeliberated intel)
CREATE INDEX IF NOT EXISTS idx_vigil_intel_date_deliberated
  ON vigil_intel(scan_date, deliberated);

-- Enable RLS (service role key bypasses this for writes)
ALTER TABLE vigil_intel ENABLE ROW LEVEL SECURITY;

-- Allow anon reads (for startup hook)
CREATE POLICY "Allow anonymous reads on vigil_intel"
  ON vigil_intel
  FOR SELECT
  USING (true);
