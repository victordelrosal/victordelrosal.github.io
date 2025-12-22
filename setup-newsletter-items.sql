-- Newsletter Items table for DAINS aggregation
-- Run this in Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS newsletter_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source tracking
  newsletter_name TEXT NOT NULL,
  email_received_at TIMESTAMPTZ NOT NULL,
  email_subject TEXT,

  -- Extracted content (from Claude parsing)
  headline TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  entities JSONB DEFAULT '[]'::jsonb,

  -- Aggregation tracking
  processed_at TIMESTAMPTZ,
  dains_slug TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_content TEXT
);

-- Index for fetching unprocessed items
CREATE INDEX IF NOT EXISTS idx_newsletter_items_unprocessed
  ON newsletter_items(email_received_at DESC)
  WHERE processed_at IS NULL;

-- Index for tracking which items went into which DAINS
CREATE INDEX IF NOT EXISTS idx_newsletter_items_dains_slug
  ON newsletter_items(dains_slug)
  WHERE dains_slug IS NOT NULL;

-- RLS policies (enable row-level security)
ALTER TABLE newsletter_items ENABLE ROW LEVEL SECURITY;

-- Allow public read (for debugging/inspection)
CREATE POLICY "Allow public read" ON newsletter_items
  FOR SELECT USING (true);

-- Allow insert from service role (Cloudflare Worker will use service key)
CREATE POLICY "Allow service insert" ON newsletter_items
  FOR INSERT WITH CHECK (true);

-- Allow update from service role (for marking as processed)
CREATE POLICY "Allow service update" ON newsletter_items
  FOR UPDATE USING (true);

COMMENT ON TABLE newsletter_items IS 'Stores parsed newsletter content for DAINS aggregation. Items are marked processed_at after inclusion in a DAINS publish.';
