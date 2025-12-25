-- Fix Leaderboard to Show All Users
-- Run this in Supabase SQL Editor

-- Drop and recreate view to show ALL users, not just those with gamification records
CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    u.id as user_id,
    COALESCE(ug.xp, 0) as xp,
    COALESCE(ug.streak_count, 0) as streak_count,
    COALESCE(ug.achievements, '{}') as achievements,
    COALESCE(ug.show_on_leaderboard, true) as show_on_leaderboard,
    COALESCE(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1)
    ) as full_name,
    COALESCE(
        u.raw_user_meta_data->>'avatar_url',
        u.raw_user_meta_data->>'picture'
    ) as avatar_url
FROM auth.users u
LEFT JOIN user_gamification ug ON u.id = ug.user_id
WHERE COALESCE(ug.show_on_leaderboard, true) = true
ORDER BY COALESCE(ug.xp, 0) DESC;
