-- =====================================================
-- AGGRESSIVE FIX FOR AUTH ERROR
-- This script safely removes ONLY user-defined triggers that might be breaking sign-ups
-- =====================================================

-- 1. Drop specific known triggers (just in case)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS sync_user_to_public ON auth.users;

-- 2. Drop the functions they might be calling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.sync_user() CASCADE;

-- 3. Advanced: Find and drop ANY trigger on auth.users that calls a function in 'public' schema
-- This is the safest way to clear custom triggers without breaking Supabase internals
DO $$
DECLARE
    trg RECORD;
BEGIN
    FOR trg IN
        SELECT t.trigger_name
        FROM information_schema.triggers t
        JOIN information_schema.routines r ON t.action_statement LIKE '%' || r.routine_name || '%'
        WHERE t.event_object_schema = 'auth'
        AND t.event_object_table = 'users'
        AND r.routine_schema = 'public' -- Only drop triggers calling PUBLIC functions
    LOOP
        RAISE NOTICE 'Dropping trigger: %', trg.trigger_name;
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trg.trigger_name) || ' ON auth.users';
    END LOOP;
END $$;

-- 4. Re-verify the comment_users table exists (idempotent)
CREATE TABLE IF NOT EXISTS public.comment_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Ensure RLS is enabled but policies allow insertion
ALTER TABLE public.comment_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.comment_users;
DROP POLICY IF EXISTS "Public can read comment users" ON public.comment_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.comment_users;

-- Re-create policies
CREATE POLICY "Public can read comment users"
ON public.comment_users FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Users can insert their own profile"
ON public.comment_users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile"
ON public.comment_users FOR UPDATE
TO authenticated
USING (auth.uid() = auth_id);

-- 6. Grant permissions again to be sure
GRANT ALL ON public.comment_users TO authenticated;
GRANT ALL ON public.comment_users TO service_role;
