-- Fix Leaderboard - Don't show deleted users
-- Run this in Supabase SQL Editor

-- Change to INNER JOIN so only users WITH gamification records appear
-- When account is deleted, we'll also delete their gamification record
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    ug.user_id,
    ug.xp,
    ug.streak_count,
    ug.achievements,
    ug.show_on_leaderboard,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
    ) as full_name,
    COALESCE(
        u.raw_user_meta_data->>'avatar_url',
        u.raw_user_meta_data->>'picture'
    ) as avatar_url
FROM user_gamification ug
INNER JOIN auth.users u ON ug.user_id = u.id
WHERE ug.show_on_leaderboard = true
ORDER BY ug.xp DESC;

-- Also update delete_own_profile to delete gamification data
CREATE OR REPLACE FUNCTION delete_own_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete gamification data first
    DELETE FROM user_gamification WHERE user_id = auth.uid();

    -- Delete from comment_users if exists
    DELETE FROM comment_users WHERE id = auth.uid();

    -- Note: auth.users deletion must be done via Supabase Admin API
    -- The user will be signed out after this
END;
$$;
