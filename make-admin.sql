-- =====================================================
-- MAKE USER SUPERADMIN
-- Run this in Supabase SQL Editor to give admin privileges to victordelrosal@gmail.com
-- =====================================================

UPDATE comment_users
SET is_admin = TRUE
WHERE email = 'victordelrosal@gmail.com';

-- Verify the update
SELECT * FROM comment_users WHERE email = 'victordelrosal@gmail.com';
