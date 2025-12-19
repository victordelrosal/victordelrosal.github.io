#!/usr/bin/env node
/**
 * DAINS Alert Utility
 *
 * Sends email alerts via Resend API for DAINS monitoring.
 *
 * Usage:
 *   node send-alert.js --type critical --subject "Subject" --body "Body text"
 *   node send-alert.js --type digest --file digest-items.json
 *
 * Environment:
 *   RESEND_API_KEY - Resend API key
 *   ALERT_EMAIL - Recipient email address
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ALERT_EMAIL = process.env.ALERT_EMAIL;

/**
 * Send an email via Resend
 */
async function sendEmail(subject, htmlBody) {
  if (!RESEND_API_KEY) {
    console.error('ERROR: RESEND_API_KEY not set');
    process.exit(1);
  }
  if (!ALERT_EMAIL) {
    console.error('ERROR: ALERT_EMAIL not set');
    process.exit(1);
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'DAINS Monitor <updates@victordelrosal.com>',
      to: ALERT_EMAIL,
      subject: subject,
      html: htmlBody,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error('Failed to send email:', result);
    process.exit(1);
  }

  console.log('Email sent successfully:', result.id);
  return result;
}

/**
 * Build HTML for critical alert
 */
function buildCriticalAlertHtml(subject, body, details = {}) {
  const { layer, error, workflowUrl, supabaseUrl, liveUrl, action } = details;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    .error-box { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
    .action-box { background: #d4edda; border: 1px solid #28a745; padding: 12px; border-radius: 4px; margin: 16px 0; }
    .links { margin-top: 20px; }
    .links a { display: inline-block; margin-right: 16px; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">DAINS Alert</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${escapeHtml(subject)}</p>
    </div>
    <div class="content">
      <p><strong>What happened:</strong> ${escapeHtml(body)}</p>

      ${layer ? `<p><strong>Failed at:</strong> Layer ${escapeHtml(layer)}</p>` : ''}

      ${error ? `<div class="error-box"><strong>Error:</strong><br>${escapeHtml(error)}</div>` : ''}

      ${action ? `<div class="action-box"><strong>Automatic action taken:</strong><br>${escapeHtml(action)}</div>` : ''}

      <div class="links">
        <strong>Quick links:</strong><br>
        ${workflowUrl ? `<a href="${escapeHtml(workflowUrl)}">View Workflow Run</a>` : ''}
        ${supabaseUrl ? `<a href="${escapeHtml(supabaseUrl)}">Supabase Dashboard</a>` : ''}
        ${liveUrl ? `<a href="${escapeHtml(liveUrl)}">Live Page</a>` : ''}
      </div>

      <p style="margin-top: 24px; font-size: 12px; color: #666;">
        This alert was sent by the DAINS Reliability System.<br>
        Time: ${new Date().toISOString()}
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Build HTML for digest alert
 */
function buildDigestHtml(items) {
  const itemsHtml = items.map(item => {
    const icon = item.severity === 'warning' ? '⚠️' : 'ℹ️';
    return `<li>${icon} ${escapeHtml(item.message)}</li>`;
  }).join('\n');

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #ffc107; color: #333; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
    ul { padding-left: 20px; }
    li { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">DAINS Morning Digest</h1>
      <p style="margin: 8px 0 0 0;">Issues from overnight that auto-resolved</p>
    </div>
    <div class="content">
      <ul>
        ${itemsHtml}
      </ul>
      <p style="margin-top: 24px; font-size: 12px; color: #666;">
        These issues were handled automatically. No action required unless they recur.<br>
        Time: ${new Date().toISOString()}
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Escape HTML entities to prevent XSS
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);

  const getArg = (name) => {
    const index = args.indexOf(`--${name}`);
    return index !== -1 ? args[index + 1] : null;
  };

  const type = getArg('type');
  const subject = getArg('subject');
  const body = getArg('body');
  const layer = getArg('layer');
  const error = getArg('error');
  const action = getArg('action');
  const workflowUrl = getArg('workflow-url');
  const file = getArg('file');

  if (type === 'critical') {
    if (!subject || !body) {
      console.error('Usage: node send-alert.js --type critical --subject "..." --body "..."');
      process.exit(1);
    }

    const todaySlug = `daily-ai-news-scan-${new Date().toISOString().split('T')[0]}`;

    const html = buildCriticalAlertHtml(subject, body, {
      layer,
      error,
      action,
      workflowUrl,
      supabaseUrl: 'https://supabase.com/dashboard/project/azzzrjnqgkqwpqnroost',
      liveUrl: `https://victordelrosal.com/${todaySlug}/`,
    });

    await sendEmail(subject, html);

  } else if (type === 'digest') {
    if (!file) {
      console.error('Usage: node send-alert.js --type digest --file digest-items.json');
      process.exit(1);
    }

    const fs = await import('fs');
    const items = JSON.parse(fs.readFileSync(file, 'utf-8'));

    if (items.length === 0) {
      console.log('No digest items, skipping email');
      process.exit(0);
    }

    const html = buildDigestHtml(items);
    await sendEmail(`DAINS Morning Digest - ${items.length} issue(s)`, html);

  } else {
    console.error('Usage: node send-alert.js --type <critical|digest> ...');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
