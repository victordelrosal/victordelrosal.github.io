#!/usr/bin/env node
/**
 * Send a test DAINS email
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_ANON_KEY=... RESEND_API_KEY=... node send-test-dains.js <email>
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function main() {
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    console.error('Usage: node send-test-dains.js <email>');
    process.exit(1);
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !RESEND_API_KEY) {
    console.error('Missing required environment variables');
    process.exit(1);
  }

  // Fetch most recent DAINS from Supabase
  console.log('Fetching most recent DAINS from Supabase...');

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/published_posts?slug=like.daily-ai-news-scan-*&order=published_at.desc&limit=1&select=*`,
    {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  const posts = await response.json();

  if (!posts || posts.length === 0) {
    console.error('No DAINS found in database');
    process.exit(1);
  }

  const post = posts[0];
  console.log(`Found: ${post.title}`);

  // Build email HTML
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 700px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 8px; }
    .header h1 { color: #B8860B; margin: 0 0 10px 0; }
    .header p { color: #ccc; margin: 0; }
    .content { background: #fff; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #999; padding-top: 20px; border-top: 1px solid #eee; }
    h2 { color: #B8860B; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    h3 { color: #333; }
    a { color: #0066cc; }
    .story-top { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #eee; }
    .hits { color: #666; font-weight: normal; font-size: 0.85em; }
    .attribution { font-size: 0.9em; color: #666; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Daily AI News Scan</h1>
      <p>[TEST EMAIL] ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <div class="content">
      ${post.content}
    </div>

    <div class="footer">
      <p>This is a test email from the DAINS system.</p>
      <p><a href="https://victordelrosal.com/${post.slug}/">View on web</a></p>
    </div>
  </div>
</body>
</html>`;

  // Send via Resend
  console.log(`Sending test email to ${recipientEmail}...`);

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Daily AI News Scan <updates@victordelrosal.com>',
      to: recipientEmail,
      subject: `[TEST] ${post.title}`,
      html: emailHtml,
    }),
  });

  const result = await emailResponse.json();

  if (!emailResponse.ok) {
    console.error('Failed to send email:', result);
    process.exit(1);
  }

  console.log(`✅ Test email sent successfully!`);
  console.log(`   Email ID: ${result.id}`);
  console.log(`   Recipient: ${recipientEmail}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
