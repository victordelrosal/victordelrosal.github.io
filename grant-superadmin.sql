-- 1. Grant admin privileges to the specific user
UPDATE public.comment_users
SET is_admin = TRUE
WHERE email = 'victordelrosal@gmail.com';

-- 2. Ensure the RLS policy for deletion is correct and robust
-- Drop existing policy to be safe
DROP POLICY IF EXISTS "Owner or admin can soft-delete comments" ON public.comments;

-- Re-create the policy
CREATE POLICY "Owner or admin can soft-delete comments"
ON public.comments FOR UPDATE
TO authenticated
USING (
  -- User is the author of the comment
  user_id IN (SELECT id FROM public.comment_users WHERE auth_id = auth.uid())
  OR 
  -- User is an admin
  EXISTS (
    SELECT 1 FROM public.comment_users 
    WHERE auth_id = auth.uid() 
    AND is_admin = TRUE
  )
);

-- 3. Verify the update
DO $$
DECLARE
  admin_count INT;
BEGIN
  SELECT COUNT(*) INTO admin_count FROM public.comment_users WHERE email = 'victordelrosal@gmail.com' AND is_admin = TRUE;
  IF admin_count > 0 THEN
    RAISE NOTICE 'SUCCESS: victordelrosal@gmail.com is now an admin.';
  ELSE
    RAISE NOTICE 'WARNING: victordelrosal@gmail.com was NOT found or NOT updated. Please check the email address.';
  END IF;
END $$;
