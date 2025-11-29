-- =====================================================
-- VICTORDELROSAL.COM - Page Views & Comments Setup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- =====================================================

-- =====================================================
-- PART 1: CREATE TABLES
-- =====================================================

-- 1. Page Views - Raw view events
CREATE TABLE IF NOT EXISTS page_views (
  id BIGSERIAL PRIMARY KEY,
  post_slug TEXT NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast count queries
CREATE INDEX IF NOT EXISTS idx_page_views_post_slug ON page_views(post_slug);

-- 2. Page View Counts - Cached counts for performance
CREATE TABLE IF NOT EXISTS page_view_counts (
  post_slug TEXT PRIMARY KEY,
  view_count BIGINT DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Comment Users - User profiles from Google OAuth
CREATE TABLE IF NOT EXISTS comment_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auth lookups
CREATE INDEX IF NOT EXISTS idx_comment_users_auth_id ON comment_users(auth_id);

-- 4. Comments - With threading support
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_slug TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES comment_users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_comments_post_slug ON comments(post_slug);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- =====================================================
-- PART 2: DATABASE FUNCTIONS
-- =====================================================

-- Function to increment page view and return new count
CREATE OR REPLACE FUNCTION increment_page_view(slug TEXT)
RETURNS BIGINT AS $$
DECLARE
  new_count BIGINT;
BEGIN
  -- Insert the view record
  INSERT INTO page_views (post_slug) VALUES (slug);

  -- Upsert the count
  INSERT INTO page_view_counts (post_slug, view_count, last_updated)
  VALUES (slug, 1, NOW())
  ON CONFLICT (post_slug)
  DO UPDATE SET
    view_count = page_view_counts.view_count + 1,
    last_updated = NOW()
  RETURNING view_count INTO new_count;

  RETURN new_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create user profile after OAuth
CREATE OR REPLACE FUNCTION get_or_create_comment_user()
RETURNS comment_users AS $$
DECLARE
  user_record comment_users;
  auth_user_record RECORD;
BEGIN
  -- Get the auth user
  SELECT * INTO auth_user_record FROM auth.users WHERE id = auth.uid();

  -- Try to get existing user
  SELECT * INTO user_record FROM comment_users WHERE auth_id = auth.uid();

  IF user_record IS NULL THEN
    -- Create new user from auth metadata
    INSERT INTO comment_users (auth_id, email, display_name, avatar_url)
    VALUES (
      auth.uid(),
      auth_user_record.email,
      COALESCE(
        auth_user_record.raw_user_meta_data->>'full_name',
        auth_user_record.raw_user_meta_data->>'name',
        split_part(auth_user_record.email, '@', 1)
      ),
      auth_user_record.raw_user_meta_data->>'avatar_url'
    )
    RETURNING * INTO user_record;
  END IF;

  RETURN user_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get comments for a post with user info
CREATE OR REPLACE FUNCTION get_comments_for_post(slug TEXT)
RETURNS TABLE (
  id UUID,
  post_slug TEXT,
  user_id UUID,
  parent_id UUID,
  content TEXT,
  created_at TIMESTAMPTZ,
  display_name TEXT,
  avatar_url TEXT,
  is_author_admin BOOLEAN,
  reply_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.post_slug,
    c.user_id,
    c.parent_id,
    c.content,
    c.created_at,
    u.display_name,
    u.avatar_url,
    u.is_admin,
    (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id AND r.is_deleted = false)::BIGINT
  FROM comments c
  JOIN comment_users u ON c.user_id = u.id
  WHERE c.post_slug = slug AND c.is_deleted = false
  ORDER BY c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- PART 3: ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_view_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- PAGE VIEWS POLICIES
-- Anyone can insert page views (anonymous tracking)
CREATE POLICY "Anyone can insert page views"
ON page_views FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- PAGE VIEW COUNTS POLICIES
-- Anyone can read view counts
CREATE POLICY "View counts are public"
ON page_view_counts FOR SELECT
TO anon, authenticated
USING (true);

-- COMMENT USERS POLICIES
-- Anyone can read user profiles (for displaying comments)
CREATE POLICY "Public can read comment users"
ON comment_users FOR SELECT
TO anon, authenticated
USING (true);

-- Authenticated users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON comment_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON comment_users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id);

-- COMMENTS POLICIES
-- Anyone can read non-deleted comments
CREATE POLICY "Public can read non-deleted comments"
ON comments FOR SELECT
TO anon, authenticated
USING (is_deleted = false);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can insert comments"
ON comments FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM comment_users WHERE auth_id = auth.uid() AND id = user_id)
);

-- Users can soft-delete their own comments, admins can delete any
CREATE POLICY "Owner or admin can soft-delete comments"
ON comments FOR UPDATE
TO authenticated
USING (
  user_id IN (SELECT id FROM comment_users WHERE auth_id = auth.uid())
  OR EXISTS (SELECT 1 FROM comment_users WHERE auth_id = auth.uid() AND is_admin = true)
);

-- =====================================================
-- PART 4: GRANT PERMISSIONS
-- =====================================================

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION increment_page_view(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_comment_user() TO authenticated;
GRANT EXECUTE ON FUNCTION get_comments_for_post(TEXT) TO anon, authenticated;

-- =====================================================
-- DONE!
-- After running this, set yourself as admin:
-- UPDATE comment_users SET is_admin = true WHERE email = 'your-email@gmail.com';
-- =====================================================
