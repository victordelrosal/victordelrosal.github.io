-- Add timezone column to comment_users
ALTER TABLE public.comment_users 
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Update the cron job to run HOURLY
-- We need to check every hour if it's 10 AM in any user's timezone
DO $$
BEGIN
    PERFORM cron.unschedule('weekly-digest');
EXCEPTION WHEN OTHERS THEN
    -- Ignore error if job doesn't exist
    NULL;
END $$;

SELECT cron.schedule(
    'weekly-digest-hourly',
    '0 * * * *', -- Run every hour at minute 0
    $$
    SELECT
        net.http_post(
            url:='https://azzzrjnqgkqwpqnroost.supabase.co/functions/v1/send-weekly-digest',
            headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
            body:='{}'::jsonb
        ) as request_id;
    $$
);
