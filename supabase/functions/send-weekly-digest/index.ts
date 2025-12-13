import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Create excerpt from HTML content by stripping tags and truncating
 */
function createExcerpt(html: string, maxLength = 150): string {
  if (!html) return '';
  // Remove HTML tags and normalize whitespace
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLength) return text;
  // Truncate at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + '...';
}

/**
 * Extract first image URL from HTML content
 * Only returns actual URLs (http/https), skips base64 data URLs
 */
function extractFirstImage(html: string): string | null {
  if (!html) return null;
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    // Only return actual URLs, skip base64 data URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    // Check for test_mode or force_send parameters
    // test_mode: bypasses Sunday check, adds [TEST] prefix
    // force_send: bypasses Sunday check, NO prefix (real email)
    let testMode = false;
    let forceSend = false;
    try {
      const body = await req.json();
      testMode = body.test_mode === true;
      forceSend = body.force_send === true;
    } catch {
      // No body or invalid JSON, continue with normal mode
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // 1. Fetch posts published in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: posts, error: postsError } = await supabase
      .from("published_posts")
      .select("*")
      .gte("published_at", sevenDaysAgo.toISOString())
      .order("published_at", { ascending: false });

    if (postsError) throw postsError;

    if (!posts || posts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No new posts this week." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch subscribed users
    // We fetch ALL subscribed users, then filter by timezone in the loop
    const { data: users, error: usersError } = await supabase
      .from("comment_users")
      .select("email, display_name, timezone")
      .eq("is_subscribed", true);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscribed users found." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Generate Email HTML
    const postsHtml = posts
      .map(
        (post) => {
          const imageUrl = extractFirstImage(post.content);
          const imageHtml = imageUrl
            ? `<a href="https://victordelrosal.com/${post.slug}">
                <img src="${imageUrl}" alt="${post.title}" style="width: 100%; max-width: 100%; height: auto; border-radius: 8px; margin-bottom: 16px; display: block;" />
              </a>`
            : '';

          return `
        <div style="margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid #eee;">
          ${imageHtml}
          <h2 style="margin: 0 0 8px 0;">
            <a href="https://victordelrosal.com/${post.slug}" style="color: #333; text-decoration: none;">
              ${post.title}
            </a>
          </h2>
          <p style="color: #666; margin: 0 0 12px 0;">
            ${new Date(post.published_at).toLocaleDateString()}
          </p>
          <p style="color: #444; margin: 0 0 12px 0; line-height: 1.5;">
            ${createExcerpt(post.content)}
          </p>
          <p style="margin: 0;">
            <a href="https://victordelrosal.com/${post.slug}" style="color: #0066cc; text-decoration: none;">Read more &rarr;</a>
          </p>
        </div>
      `;
        }
      )
      .join("");

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #B8860B;">Weekly Waves 🌊</h1>
            <p>Here's what Victor posted this week.</p>
          </div>
          
          ${postsHtml}
          
          <div class="footer">
            <p>You received this email because you are subscribed to updates from victordelrosal.com.</p>
            <p><a href="https://victordelrosal.com" style="color: #999;">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 4. Send Emails (Filtered by Timezone)
    const results = [];
    let sentCount = 0;

    for (const user of users) {
      // Determine if it is 10 AM on Sunday in the user's timezone
      const userTimezone = user.timezone || 'UTC';

      try {
        const now = new Date();
        const userDateString = now.toLocaleString('en-US', { timeZone: userTimezone });
        const userDate = new Date(userDateString);

        // Check if it's Sunday (0) and 10 AM (10), OR if test_mode/force_send is enabled
        // We allow a small window (e.g., run at 10:05, still counts)
        const isSundayMorning = userDate.getDay() === 0 && userDate.getHours() === 10;

        if (testMode || forceSend || isSundayMorning) {
          const subjectPrefix = testMode ? "[TEST] " : "";

          console.log(`Attempting to send email to: ${user.email}`);

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Victor del Rosal <updates@victordelrosal.com>",
              to: user.email,
              subject: `${subjectPrefix}Weekly Waves: ${posts.length} new post${posts.length > 1 ? 's' : ''}`,
              html: emailHtml,
            }),
          });

          const resBody = await res.json();
          console.log(`Email to ${user.email}: status=${res.status}, response=${JSON.stringify(resBody)}`);

          results.push({ email: user.email, status: res.status, response: resBody });
          if (res.ok) sentCount++;

          // Rate limit: wait 600ms between emails (Resend allows 2/sec)
          await new Promise(resolve => setTimeout(resolve, 600));

        } else {
          // Not the right time for this user
          // console.log(`Skipping ${user.email} (${userTimezone}): It is ${userDate.getDay()} ${userDate.getHours()}:00`);
        }
      } catch (err) {
        console.error(`Error processing user ${user.email} with timezone ${userTimezone}:`, err);
      }
    }

    // 5. Log the run (only if emails were sent)
    if (sentCount > 0) {
      await supabase.from("weekly_email_logs").insert({
        post_count: posts.length,
        recipient_count: sentCount,
        status: testMode ? "test" : forceSend ? "force_send" : "success",
      });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${users.length} users. Sent emails to ${sentCount} users.`,
        postCount: posts.length,
        testMode: testMode,
        forceSend: forceSend,
        results: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
