-- Add subscription column to comment_users
ALTER TABLE public.comment_users 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT TRUE;

-- Function to delete own account (removes profile data)
-- Note: This removes the public profile. The auth account remains but is effectively reset.
CREATE OR REPLACE FUNCTION delete_own_profile()
RETURNS void AS $$
BEGIN
  DELETE FROM public.comment_users
  WHERE auth_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_own_profile() TO authenticated;
