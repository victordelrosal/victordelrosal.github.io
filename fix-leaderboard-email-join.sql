-- Fix Leaderboard - Join on email since IDs don't match
-- Run this in Supabase SQL Editor

CREATE OR REPLACE VIEW public.leaderboard_view AS
SELECT
    u.id as user_id,
    COALESCE(ug.xp, 0) as xp,
    COALESCE(ug.streak_count, 0) as streak_count,
    COALESCE(ug.achievements, '{}') as achievements,
    COALESCE(ug.show_on_leaderboard, true) as show_on_leaderboard,
    cu.display_name as full_name,
    cu.avatar_url as avatar_url
FROM comment_users cu
LEFT JOIN auth.users u ON u.email = cu.email
LEFT JOIN user_gamification ug ON ug.user_id = u.id
WHERE COALESCE(ug.show_on_leaderboard, true) = true
ORDER BY COALESCE(ug.xp, 0) DESC;
