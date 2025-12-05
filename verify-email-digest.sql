-- 1. See what posts are eligible for the digest (Last 7 Days)
SELECT title, published_at, slug
FROM public.published_posts
WHERE published_at >= NOW() - INTERVAL '7 days'
ORDER BY published_at DESC;

-- 2. Check the email logs (Run this AFTER clicking 'Test' in the dashboard)
SELECT * 
FROM public.weekly_email_logs 
ORDER BY sent_at DESC;

-- 3. Check your subscriber count
SELECT COUNT(*) as subscriber_count 
FROM public.comment_users 
WHERE is_subscribed = true;
