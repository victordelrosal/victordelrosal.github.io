-- User Gamification Data Table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    xp INTEGER DEFAULT 0,
    stats JSONB DEFAULT '{"reads": 0, "waves": 0, "comments": 0, "shares": 0, "postsRead": []}'::jsonb,
    achievements TEXT[] DEFAULT '{}',
    streak_count INTEGER DEFAULT 0,
    streak_last_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "Users can view own gamification data"
    ON user_gamification FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification data"
    ON user_gamification FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data"
    ON user_gamification FOR UPDATE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id ON user_gamification(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_update_gamification_updated_at ON user_gamification;
CREATE TRIGGER trigger_update_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_gamification_updated_at();
