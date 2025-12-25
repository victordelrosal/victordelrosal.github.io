-- Leaderboard Feature Migration
-- Run this in Supabase SQL Editor

-- Add leaderboard visibility column (default OFF for privacy)
ALTER TABLE user_gamification
ADD COLUMN IF NOT EXISTS show_on_leaderboard BOOLEAN DEFAULT false;

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_gamification_leaderboard
ON user_gamification(show_on_leaderboard, xp DESC)
WHERE show_on_leaderboard = true;

-- Policy: Anyone can view leaderboard entries (users who opted in)
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON user_gamification;
CREATE POLICY "Anyone can view leaderboard"
    ON user_gamification FOR SELECT
    USING (show_on_leaderboard = true);

-- Create view for leaderboard with user info from auth.users
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
JOIN auth.users u ON ug.user_id = u.id
WHERE ug.show_on_leaderboard = true
ORDER BY ug.xp DESC;

-- Grant access to the view
GRANT SELECT ON public.leaderboard_view TO authenticated;
GRANT SELECT ON public.leaderboard_view TO anon;
