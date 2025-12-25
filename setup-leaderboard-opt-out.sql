-- Change Leaderboard to Opt-Out Model
-- Run this in Supabase SQL Editor AFTER the initial setup-leaderboard.sql

-- Change default to true (opt-out instead of opt-in)
ALTER TABLE user_gamification
ALTER COLUMN show_on_leaderboard SET DEFAULT true;

-- Update all existing users to show on leaderboard (opt-out model)
UPDATE user_gamification
SET show_on_leaderboard = true
WHERE show_on_leaderboard = false OR show_on_leaderboard IS NULL;
