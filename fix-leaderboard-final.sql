-- Fix Leaderboard - Show all registered users with correct XP
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
FROM auth.users u
INNER JOIN comment_users cu ON cu.id = u.id
LEFT JOIN user_gamification ug ON ug.user_id = u.id
WHERE COALESCE(ug.show_on_leaderboard, true) = true
ORDER BY COALESCE(ug.xp, 0) DESC;
