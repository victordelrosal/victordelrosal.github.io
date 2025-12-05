-- 1. Create a table to log sent emails (to avoid duplicates and track history)
CREATE TABLE IF NOT EXISTS public.weekly_email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    post_count INT NOT NULL,
    recipient_count INT NOT NULL,
    status TEXT DEFAULT 'success',
    error_message TEXT
);

-- 2. Enable the pg_cron extension (if not already enabled)
-- Note: This might require superuser permissions. If it fails, enable it in the Dashboard.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the weekly email (Every Monday at 9:00 AM UTC)
-- Replace 'https://PROJECT_REF.supabase.co/functions/v1/send-weekly-digest' with your actual Edge Function URL
-- You can find this URL in the Supabase Dashboard under Edge Functions.
-- IMPORTANT: You must replace the URL and the SERVICE_ROLE_KEY below.

/*
SELECT cron.schedule(
    'weekly-digest',
    '0 9 * * 1', -- Every Monday at 9:00 AM
    $$
    SELECT
        net.http_post(
            url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-weekly-digest',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
            body:='{}'::jsonb
        ) as request_id;
    $$
);
*/

-- NOTE: The cron job above is commented out because you need to fill in your Project URL and Key.
-- It's often easier to set up the schedule directly in the Supabase Dashboard -> Edge Functions.
