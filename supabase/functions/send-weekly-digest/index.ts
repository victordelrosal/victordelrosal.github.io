import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
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
        (post) => `
        <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #eee;">
          <h2 style="margin: 0 0 8px 0;">
            <a href="https://victordelrosal.com/${post.slug}" style="color: #333; text-decoration: none;">
              ${post.title}
            </a>
          </h2>
          <p style="color: #666; margin: 0 0 12px 0;">
            ${new Date(post.published_at).toLocaleDateString()}
          </p>
          <p style="margin: 0;">
            <a href="https://victordelrosal.com/${post.slug}" style="color: #0066cc; text-decoration: none;">Read more &rarr;</a>
          </p>
        </div>
      `
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

        // Check if it's Sunday (0) and 10 AM (10)
        // We allow a small window (e.g., run at 10:05, still counts)
        if (userDate.getDay() === 0 && userDate.getHours() === 10) {

          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Victor del Rosal <updates@victordelrosal.com>",
              to: user.email,
              subject: `Weekly Waves: ${posts.length} new post${posts.length > 1 ? 's' : ''}`,
              html: emailHtml,
            }),
          });
          results.push({ email: user.email, status: res.status });
          if (res.ok) sentCount++;

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
        status: "success",
      });
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${users.length} users. Sent emails to ${sentCount} users.`,
        postCount: posts.length
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
