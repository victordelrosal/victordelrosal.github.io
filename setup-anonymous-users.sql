-- Anonymous Users Table & Leaderboard Integration
-- Run this in Supabase SQL Editor

-- =============================================
-- 1. CREATE ANONYMOUS USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS anonymous_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anon_id TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    stats JSONB DEFAULT '{"reads": 0, "waves": 0, "comments": 0, "shares": 0, "postsRead": []}'::jsonb,
    achievements TEXT[] DEFAULT '{}',
    streak_count INTEGER DEFAULT 0,
    streak_last_date DATE,
    show_on_leaderboard BOOLEAN DEFAULT true,
    first_seen TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by anon_id
CREATE INDEX IF NOT EXISTS idx_anonymous_users_anon_id ON anonymous_users(anon_id);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_anonymous_users_leaderboard
ON anonymous_users(show_on_leaderboard, xp DESC)
WHERE show_on_leaderboard = true AND xp > 0;

-- Enable RLS
ALTER TABLE anonymous_users ENABLE ROW LEVEL SECURITY;

-- Anyone can read anonymous users (for leaderboard)
CREATE POLICY "Anyone can view anonymous leaderboard"
    ON anonymous_users FOR SELECT
    USING (show_on_leaderboard = true AND xp > 0);

-- Anonymous users can be created/updated via API (service role)
-- We'll use anon key with specific functions

-- =============================================
-- 2. FUNCTIONS FOR ANONYMOUS USER MANAGEMENT
-- =============================================

-- Create or get anonymous user
CREATE OR REPLACE FUNCTION get_or_create_anonymous_user(
    p_anon_id TEXT,
    p_display_name TEXT
)
RETURNS anonymous_users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user anonymous_users;
BEGIN
    -- Try to get existing user
    SELECT * INTO v_user FROM anonymous_users WHERE anon_id = p_anon_id;

    IF v_user.id IS NULL THEN
        -- Create new anonymous user
        INSERT INTO anonymous_users (anon_id, display_name)
        VALUES (p_anon_id, p_display_name)
        RETURNING * INTO v_user;
    ELSE
        -- Update last_seen
        UPDATE anonymous_users
        SET last_seen = NOW()
        WHERE anon_id = p_anon_id
        RETURNING * INTO v_user;
    END IF;

    RETURN v_user;
END;
$$;

-- Update anonymous user XP
CREATE OR REPLACE FUNCTION update_anonymous_xp(
    p_anon_id TEXT,
    p_xp_to_add INTEGER,
    p_stats JSONB DEFAULT NULL
)
RETURNS anonymous_users
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user anonymous_users;
BEGIN
    UPDATE anonymous_users
    SET
        xp = xp + p_xp_to_add,
        stats = COALESCE(p_stats, stats),
        last_seen = NOW()
    WHERE anon_id = p_anon_id
    RETURNING * INTO v_user;

    RETURN v_user;
END;
$$;

-- Merge anonymous user to registered account
CREATE OR REPLACE FUNCTION merge_anonymous_to_registered(
    p_anon_id TEXT,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_anon anonymous_users;
    v_existing_xp INTEGER;
BEGIN
    -- Get anonymous user data
    SELECT * INTO v_anon FROM anonymous_users WHERE anon_id = p_anon_id;

    IF v_anon.id IS NULL THEN
        RETURN FALSE; -- No anonymous user to merge
    END IF;

    -- Check if user already has gamification record
    SELECT xp INTO v_existing_xp FROM user_gamification WHERE user_id = p_user_id;

    IF v_existing_xp IS NULL THEN
        -- Create new gamification record with anonymous data
        INSERT INTO user_gamification (user_id, xp, stats, achievements, streak_count, streak_last_date)
        VALUES (p_user_id, v_anon.xp, v_anon.stats, v_anon.achievements, v_anon.streak_count, v_anon.streak_last_date);
    ELSE
        -- Merge: add XP, merge achievements, keep higher streak
        UPDATE user_gamification
        SET
            xp = xp + v_anon.xp,
            achievements = (
                SELECT ARRAY(SELECT DISTINCT unnest(achievements || v_anon.achievements))
            ),
            streak_count = GREATEST(streak_count, v_anon.streak_count)
        WHERE user_id = p_user_id;
    END IF;

    -- Delete anonymous record
    DELETE FROM anonymous_users WHERE anon_id = p_anon_id;

    RETURN TRUE;
END;
$$;

-- =============================================
-- 3. UPDATE LEADERBOARD VIEW
-- =============================================

CREATE OR REPLACE VIEW public.leaderboard_view AS
-- Registered users
SELECT
    u.id as user_id,
    COALESCE(ug.xp, 0) as xp,
    COALESCE(ug.streak_count, 0) as streak_count,
    COALESCE(ug.achievements, '{}') as achievements,
    COALESCE(ug.show_on_leaderboard, true) as show_on_leaderboard,
    cu.display_name as full_name,
    cu.avatar_url as avatar_url,
    'registered' as user_type,
    NULL as anon_id
FROM comment_users cu
LEFT JOIN auth.users u ON u.email = cu.email
LEFT JOIN user_gamification ug ON ug.user_id = u.id
WHERE COALESCE(ug.show_on_leaderboard, true) = true

UNION ALL

-- Anonymous users (only those with XP > 0)
SELECT
    au.id as user_id,
    au.xp,
    au.streak_count,
    au.achievements,
    au.show_on_leaderboard,
    au.display_name as full_name,
    NULL as avatar_url,
    'anonymous' as user_type,
    au.anon_id
FROM anonymous_users au
WHERE au.show_on_leaderboard = true AND au.xp > 0

ORDER BY xp DESC;

-- Grant access
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO anon;
GRANT EXECUTE ON FUNCTION get_or_create_anonymous_user TO anon;
GRANT EXECUTE ON FUNCTION update_anonymous_xp TO anon;
GRANT EXECUTE ON FUNCTION merge_anonymous_to_registered TO authenticated;
