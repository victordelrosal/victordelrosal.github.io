-- Fix Leaderboard - Show all registered and anonymous users with correct XP
-- Run this in Supabase SQL Editor
--
-- IMPORTANT: This view must include:
-- 1. Email-based join (IDs don't match between auth.users and comment_users)
-- 2. Both registered AND anonymous users via UNION ALL
-- 3. user_type and anon_id fields for the UI to work properly

CREATE OR REPLACE VIEW public.leaderboard_view AS
-- Registered users (join via email since IDs don't match)
SELECT
    u.id as user_id,
    COALESCE(ug.xp, 0) as xp,
    COALESCE(ug.streak_count, 0) as streak_count,
    COALESCE(ug.achievements, '{}') as achievements,
    COALESCE(ug.show_on_leaderboard, true) as show_on_leaderboard,
    cu.display_name as full_name,
    cu.avatar_url as avatar_url,
    'registered' as user_type,
    NULL::text as anon_id
FROM comment_users cu
LEFT JOIN auth.users u ON u.email = cu.email
LEFT JOIN user_gamification ug ON ug.user_id = u.id
WHERE COALESCE(ug.show_on_leaderboard, true) = true

UNION ALL

-- Anonymous users (only those with XP > 0 who opted in)
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
