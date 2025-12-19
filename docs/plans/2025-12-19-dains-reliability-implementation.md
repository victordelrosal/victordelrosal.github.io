# DAINS Reliability System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement three-layer verification with self-healing and alerting for Daily AI News Scan

**Architecture:** New verify-dains.yml workflow runs 30 min after scan, checks workflow status → Supabase data → live URL. Auto-retries failures, publishes fallback placeholder if all else fails, sends critical alerts via Resend immediately and minor issues in morning digest.

**Tech Stack:** GitHub Actions, Node.js, Supabase, Resend API

---

## Prerequisites (Manual Steps)

Before starting implementation, complete these manual steps:

### P1: Add RESEND_API_KEY to GitHub Secrets

1. Get your Resend API key from https://resend.com/api-keys
2. Go to https://github.com/victordelrosal/victordelrosal.github.io/settings/secrets/actions
3. Click "New repository secret"
4. Name: `RESEND_API_KEY`
5. Value: your Resend API key
6. Click "Add secret"

### P2: Add ALERT_EMAIL to GitHub Secrets

1. Same settings page
2. Name: `ALERT_EMAIL`
3. Value: your email address for receiving alerts
4. Click "Add secret"

---

## Task 1: Update daily-ai-news-scan.yml Schedule

**Files:**
- Modify: `.github/workflows/daily-ai-news-scan.yml:5-6`

**Step 1: Update the cron schedule**

Change from:
```yaml
on:
  schedule:
    # Run at 5:00 AM UTC (GMT) every day
    - cron: '0 5 * * *'
```

To:
```yaml
on:
  schedule:
    # Run at 7:00 AM Dublin time (handles DST)
    # Winter (GMT): 07:00 UTC = 7am Dublin
    # Summer (IST): 06:00 UTC = 7am Dublin
    - cron: '0 6 * * *'
    - cron: '0 7 * * *'
```

**Step 2: Verify the change**

Run: `cat .github/workflows/daily-ai-news-scan.yml | head -15`
Expected: Two cron entries visible

**Step 3: Commit**

```bash
git add .github/workflows/daily-ai-news-scan.yml
git commit -m "chore: update DAINS schedule to 7am Dublin (DST-aware)"
```

---

## Task 2: Add Early Exit to build-scan.js

**Files:**
- Modify: `ai-daily-intel/build-scan.js:314-330`

**Step 1: Add check for existing scan after loading sources**

Insert after line 326 (`console.log(\`\nLoaded ${enabledRSS.length} RSS sources...`):

```javascript
  // Check if today's scan already exists (for DST dual-schedule)
  const today = new Date();
  const todaySlug = `daily-ai-news-scan-${today.toISOString().split('T')[0]}`;

  const { data: existing } = await supabase
    .from('published_posts')
    .select('id')
    .eq('slug', todaySlug)
    .single();

  if (existing && !DRY_RUN) {
    console.log(`\n✅ Scan for today (${todaySlug}) already exists. Skipping.`);
    console.log('This is expected when both DST schedules fire.\n');
    process.exit(0);
  }
```

**Step 2: Test locally (dry run)**

Run: `cd ai-daily-intel && SUPABASE_URL='...' SUPABASE_ANON_KEY='...' node build-scan.js --dry-run 2>&1 | head -30`
Expected: Should proceed normally (no scan exists message since it's dry run)

**Step 3: Commit**

```bash
git add ai-daily-intel/build-scan.js
git commit -m "feat: add early exit when today's scan already exists"
```

---

## Task 3: Create send-alert.js Utility

**Files:**
- Create: `ai-daily-intel/send-alert.js`

**Step 1: Create the alert utility**

```javascript
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
    .error-box { background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 4px; margin: 16px 0; font-family: monospace; font-size: 13px; }
    .action-box { background: #d4edda; border: 1px solid #28a745; padding: 12px; border-radius: 4px; margin: 16px 0; }
    .links { margin-top: 20px; }
    .links a { display: inline-block; margin-right: 16px; color: #0066cc; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">🚨 DAINS Alert</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${subject}</p>
    </div>
    <div class="content">
      <p><strong>What happened:</strong> ${body}</p>

      ${layer ? `<p><strong>Failed at:</strong> Layer ${layer}</p>` : ''}

      ${error ? `<div class="error-box"><strong>Error:</strong><br>${error}</div>` : ''}

      ${action ? `<div class="action-box"><strong>Automatic action taken:</strong><br>${action}</div>` : ''}

      <div class="links">
        <strong>Quick links:</strong><br>
        ${workflowUrl ? `<a href="${workflowUrl}">View Workflow Run</a>` : ''}
        ${supabaseUrl ? `<a href="${supabaseUrl}">Supabase Dashboard</a>` : ''}
        ${liveUrl ? `<a href="${liveUrl}">Live Page</a>` : ''}
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
    return `<li>${icon} ${item.message}</li>`;
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
      <h1 style="margin: 0;">📋 DAINS Morning Digest</h1>
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

    const html = buildCriticalAlertHtml(subject, body, {
      layer,
      error,
      action,
      workflowUrl,
      supabaseUrl: 'https://supabase.com/dashboard/project/azzzrjnqgkqwpqnroost',
      liveUrl: `https://victordelrosal.com/daily-ai-news-scan-${new Date().toISOString().split('T')[0]}/`,
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
    await sendEmail(`📋 DAINS Morning Digest - ${items.length} issue(s)`, html);

  } else {
    console.error('Usage: node send-alert.js --type <critical|digest> ...');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
```

**Step 2: Test the script syntax**

Run: `node --check ai-daily-intel/send-alert.js`
Expected: No output (syntax OK)

**Step 3: Commit**

```bash
git add ai-daily-intel/send-alert.js
git commit -m "feat: add send-alert.js utility for DAINS monitoring"
```

---

## Task 4: Create verify-dains.yml Workflow

**Files:**
- Create: `.github/workflows/verify-dains.yml`

**Step 1: Create the verification workflow**

```yaml
name: Verify DAINS

on:
  schedule:
    # Run 30 min after DAINS (7:30 AM Dublin, handles DST)
    - cron: '30 6 * * *'
    - cron: '30 7 * * *'

  # Allow manual trigger for testing
  workflow_dispatch:

jobs:
  verify:
    runs-on: ubuntu-latest

    env:
      TODAY_SLUG: daily-ai-news-scan-${{ github.run_id }}
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
      RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
      ALERT_EMAIL: ${{ secrets.ALERT_EMAIL }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Calculate today's date and slug
        id: date
        run: |
          TODAY=$(date -u +%Y-%m-%d)
          echo "date=$TODAY" >> $GITHUB_OUTPUT
          echo "slug=daily-ai-news-scan-$TODAY" >> $GITHUB_OUTPUT
          echo "Today's scan slug: daily-ai-news-scan-$TODAY"

      # ========================================
      # LAYER 1: Check workflow status
      # ========================================
      - name: "Layer 1: Check daily-ai-news-scan workflow status"
        id: layer1
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          echo "Checking workflow runs for today..."

          # Get today's runs of daily-ai-news-scan
          RUNS=$(gh run list --workflow=daily-ai-news-scan.yml --limit=5 --json status,conclusion,createdAt,databaseId)

          # Check if any run today succeeded
          TODAY="${{ steps.date.outputs.date }}"
          SUCCESS=$(echo "$RUNS" | jq -r ".[] | select(.createdAt | startswith(\"$TODAY\")) | select(.conclusion == \"success\") | .databaseId" | head -1)

          if [ -n "$SUCCESS" ]; then
            echo "✅ Layer 1 PASSED: Workflow succeeded (run $SUCCESS)"
            echo "status=success" >> $GITHUB_OUTPUT
          else
            echo "❌ Layer 1 FAILED: No successful workflow run found for today"
            echo "status=failed" >> $GITHUB_OUTPUT
            echo "error=No successful daily-ai-news-scan run found for $TODAY" >> $GITHUB_OUTPUT
          fi

      # ========================================
      # LAYER 2: Check Supabase data
      # ========================================
      - name: "Layer 2: Check Supabase for today's scan"
        id: layer2
        run: |
          echo "Querying Supabase for slug: ${{ steps.date.outputs.slug }}"

          RESPONSE=$(curl -s \
            "${SUPABASE_URL}/rest/v1/published_posts?slug=eq.${{ steps.date.outputs.slug }}&select=id,slug,content" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json")

          # Check if we got a result
          COUNT=$(echo "$RESPONSE" | jq 'length')

          if [ "$COUNT" -eq "0" ]; then
            echo "❌ Layer 2 FAILED: No record found in Supabase"
            echo "status=failed" >> $GITHUB_OUTPUT
            echo "error=No published_posts record found for ${{ steps.date.outputs.slug }}" >> $GITHUB_OUTPUT
          else
            # Check content length
            CONTENT_LEN=$(echo "$RESPONSE" | jq -r '.[0].content | length')
            if [ "$CONTENT_LEN" -lt 500 ]; then
              echo "❌ Layer 2 FAILED: Content too short ($CONTENT_LEN chars)"
              echo "status=failed" >> $GITHUB_OUTPUT
              echo "error=Content length $CONTENT_LEN is less than 500 chars" >> $GITHUB_OUTPUT
            else
              echo "✅ Layer 2 PASSED: Record exists with $CONTENT_LEN chars"
              echo "status=success" >> $GITHUB_OUTPUT
            fi
          fi

      # ========================================
      # LAYER 3: Check live URL
      # ========================================
      - name: "Layer 3: Check live URL"
        id: layer3
        run: |
          URL="https://victordelrosal.com/${{ steps.date.outputs.slug }}/"
          echo "Fetching: $URL"

          HTTP_CODE=$(curl -s -o /tmp/page.html -w "%{http_code}" "$URL")

          if [ "$HTTP_CODE" != "200" ]; then
            echo "❌ Layer 3 FAILED: HTTP $HTTP_CODE"
            echo "status=failed" >> $GITHUB_OUTPUT
            echo "error=Live URL returned HTTP $HTTP_CODE (expected 200)" >> $GITHUB_OUTPUT
          else
            # Check for real content
            if grep -q "Executive Summary" /tmp/page.html; then
              echo "✅ Layer 3 PASSED: Page loads with expected content"
              echo "status=success" >> $GITHUB_OUTPUT
            else
              echo "❌ Layer 3 FAILED: Page loaded but missing expected content"
              echo "status=failed" >> $GITHUB_OUTPUT
              echo "error=Page loaded but does not contain 'Executive Summary'" >> $GITHUB_OUTPUT
            fi
          fi

      # ========================================
      # RETRY LOGIC
      # ========================================
      - name: "Retry: Trigger daily-ai-news-scan if Layer 1 or 2 failed"
        if: steps.layer1.outputs.status == 'failed' || steps.layer2.outputs.status == 'failed'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          echo "🔄 Triggering retry of daily-ai-news-scan..."
          gh workflow run daily-ai-news-scan.yml
          echo "Waiting 5 minutes for workflow to complete..."
          sleep 300

      - name: "Retry: Trigger build-waves if Layer 3 failed"
        if: steps.layer3.outputs.status == 'failed' && steps.layer2.outputs.status == 'success'
        env:
          GH_TOKEN: ${{ github.token }}
        run: |
          echo "🔄 Triggering retry of build-waves..."
          gh workflow run build-waves.yml
          echo "Waiting 2 minutes for workflow and GitHub Pages deploy..."
          sleep 120

      # ========================================
      # RE-VERIFY AFTER RETRY
      # ========================================
      - name: "Re-verify Layer 3 after retry"
        id: layer3_retry
        if: steps.layer3.outputs.status == 'failed'
        run: |
          URL="https://victordelrosal.com/${{ steps.date.outputs.slug }}/"
          echo "Re-checking: $URL"

          HTTP_CODE=$(curl -s -o /tmp/page2.html -w "%{http_code}" "$URL")

          if [ "$HTTP_CODE" = "200" ] && grep -q "Executive Summary" /tmp/page2.html; then
            echo "✅ Layer 3 PASSED on retry"
            echo "status=success" >> $GITHUB_OUTPUT
            echo "retried=true" >> $GITHUB_OUTPUT
          else
            echo "❌ Layer 3 STILL FAILED after retry"
            echo "status=failed" >> $GITHUB_OUTPUT
          fi

      # ========================================
      # FALLBACK: Publish placeholder
      # ========================================
      - name: "Fallback: Publish placeholder if all retries failed"
        id: fallback
        if: |
          (steps.layer1.outputs.status == 'failed' || steps.layer2.outputs.status == 'failed') ||
          (steps.layer3.outputs.status == 'failed' && steps.layer3_retry.outputs.status != 'success')
        run: |
          echo "🚨 Publishing fallback placeholder..."

          TODAY="${{ steps.date.outputs.date }}"
          SLUG="${{ steps.date.outputs.slug }}"
          FORMATTED_DATE=$(date -d "$TODAY" "+%A, %B %d, %Y" 2>/dev/null || date -j -f "%Y-%m-%d" "$TODAY" "+%A, %B %d, %Y")

          # Create fallback content
          FALLBACK_CONTENT="<h1>Daily AI News Scan — $FORMATTED_DATE</h1>
          <img src=\"https://victordelrosal.com/img/daily-ai-news-scan.png\" alt=\"Daily AI News Scan\" style=\"width: 100%; max-width: 800px; height: auto; margin-bottom: 2rem; border-radius: 8px;\">
          <h2>System Notice</h2>
          <p>Today's automated scan encountered an issue and could not be generated.</p>
          <p>Please check back later, or view <a href=\"/waves/\">previous scans</a>.</p>
          <hr>
          <p><em>This is an automated fallback page. The DAINS team has been notified.</em></p>"

          # Insert into Supabase (upsert)
          curl -X POST "${SUPABASE_URL}/rest/v1/published_posts" \
            -H "apikey: ${SUPABASE_ANON_KEY}" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -H "Prefer: resolution=merge-duplicates" \
            -d "{
              \"note_id\": \"ai-news-scan-fallback-${TODAY//-/}.md\",
              \"slug\": \"$SLUG\",
              \"title\": \"Daily AI News Scan — $FORMATTED_DATE\",
              \"content\": $(echo "$FALLBACK_CONTENT" | jq -Rs .),
              \"image\": \"https://victordelrosal.com/img/daily-ai-news-scan.png\",
              \"published_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
            }"

          echo "fallback_published=true" >> $GITHUB_OUTPUT

          # Trigger build-waves to generate static page
          gh workflow run build-waves.yml
        env:
          GH_TOKEN: ${{ github.token }}

      # ========================================
      # ALERTING
      # ========================================
      - name: "Alert: Send critical alert if fallback was published"
        if: steps.fallback.outputs.fallback_published == 'true'
        working-directory: ai-daily-intel
        run: |
          LAYER="unknown"
          ERROR="Multiple layers failed"

          if [ "${{ steps.layer1.outputs.status }}" = "failed" ]; then
            LAYER="1 (Workflow)"
            ERROR="${{ steps.layer1.outputs.error }}"
          elif [ "${{ steps.layer2.outputs.status }}" = "failed" ]; then
            LAYER="2 (Supabase)"
            ERROR="${{ steps.layer2.outputs.error }}"
          elif [ "${{ steps.layer3.outputs.status }}" = "failed" ]; then
            LAYER="3 (Live URL)"
            ERROR="${{ steps.layer3.outputs.error }}"
          fi

          node send-alert.js \
            --type critical \
            --subject "🚨 DAINS FAILED - Fallback published for ${{ steps.date.outputs.date }}" \
            --body "The Daily AI News Scan failed and a fallback placeholder was published." \
            --layer "$LAYER" \
            --error "$ERROR" \
            --action "Fallback placeholder published. Manual investigation required." \
            --workflow-url "https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"

      - name: "Summary: All checks passed"
        if: |
          steps.layer1.outputs.status == 'success' &&
          steps.layer2.outputs.status == 'success' &&
          (steps.layer3.outputs.status == 'success' || steps.layer3_retry.outputs.status == 'success')
        run: |
          echo "✅ All verification layers passed!"
          echo ""
          echo "Layer 1 (Workflow): ✅"
          echo "Layer 2 (Supabase): ✅"
          echo "Layer 3 (Live URL): ✅"

          if [ "${{ steps.layer3_retry.outputs.retried }}" = "true" ]; then
            echo ""
            echo "Note: Layer 3 required a retry (build-waves was triggered)"
            # TODO: Add to digest for morning email
          fi
```

**Step 2: Validate YAML syntax**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/verify-dains.yml'))"`
Expected: No output (valid YAML)

**Step 3: Commit**

```bash
git add .github/workflows/verify-dains.yml
git commit -m "feat: add verify-dains.yml workflow with three-layer verification"
```

---

## Task 5: Test the Complete System

**Step 1: Push all changes**

```bash
git push
```

**Step 2: Manually trigger verify-dains workflow**

```bash
gh workflow run verify-dains.yml
```

**Step 3: Watch the workflow**

```bash
gh run watch
```

Expected: All three layers should pass (assuming today's scan exists)

**Step 4: Verify workflow completed successfully**

```bash
gh run list --workflow=verify-dains.yml --limit=1
```

Expected: `completed  success`

---

## Task 6: Test Alert Sending (Optional)

**Step 1: Test send-alert.js locally**

```bash
cd ai-daily-intel
RESEND_API_KEY="your-key" ALERT_EMAIL="your@email.com" \
  node send-alert.js --type critical --subject "Test Alert" --body "This is a test"
```

Expected: Email received with test content

---

## Verification Checklist

After implementation, verify:

- [ ] `daily-ai-news-scan.yml` has two cron schedules (0 6,7 * * *)
- [ ] `build-scan.js` exits early if today's scan exists
- [ ] `send-alert.js` exists and passes syntax check
- [ ] `verify-dains.yml` exists and passes YAML validation
- [ ] `RESEND_API_KEY` secret is set in GitHub
- [ ] `ALERT_EMAIL` secret is set in GitHub
- [ ] Manual trigger of verify-dains.yml succeeds
- [ ] All three verification layers report success

---

## Rollback Plan

If issues arise:

1. Disable verify-dains.yml: Rename to `verify-dains.yml.disabled`
2. Revert schedule change: Set daily-ai-news-scan back to `0 5 * * *`
3. Remove early exit: Revert build-scan.js changes

```bash
git revert HEAD~4..HEAD  # Reverts last 4 commits
git push
```
