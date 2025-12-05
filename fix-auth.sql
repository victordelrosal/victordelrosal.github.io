-- =====================================================
-- FIX SUPABASE AUTH ERROR
-- Run this in Supabase SQL Editor to fix the "Database error saving new user" issue
-- =====================================================

-- 1. Drop common triggers that might be causing the issue
-- We are using a client-side call to create users, so we don't need these triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- 2. Ensure the comment_users table exists and has the correct structure
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

-- 3. Ensure the function to create users exists and is secure
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION get_or_create_comment_user() TO authenticated;
GRANT ALL ON comment_users TO authenticated;
GRANT ALL ON comment_users TO service_role;
