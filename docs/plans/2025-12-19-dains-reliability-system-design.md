# DAINS Reliability System Design

**Date:** 2025-12-19
**Status:** Approved
**Goal:** Near-absolute certainty that Daily AI News Scan publishes automatically, indefinitely

## Problem Statement

The Daily AI News Scan (DAINS) runs automatically at 5am UTC but has no monitoring or alerting. Failures are silent - today's bug (new pages not being committed) was only discovered when manually clicking a link and seeing a 404.

For an automated system to be trustworthy, it must:
- Detect its own failures
- Attempt self-healing
- Alert humans when intervention is needed
- Never leave readers with a broken experience (404)

## Design Principles

- **Fully automated** - No manual steps in normal operation
- **Redundant** - Multiple verification layers, not trusting any single check
- **Dependable** - Handles transient failures (API timeouts, rate limits) automatically
- **Fool-proof** - Even total failure results in a placeholder, not a 404
- **Reliable** - Works across timezone changes (DST)
- **Trustworthy** - If you don't get an alert, the system is working

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  7:00 AM Dublin (06:00 or 07:00 UTC depending on DST)          │
│  ┌──────────────────┐                                           │
│  │ daily-ai-news-   │──► Supabase                               │
│  │ scan.yml         │    (published_posts)                      │
│  └────────┬─────────┘                                           │
│           │ on failure: retry up to 2x                          │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ build-waves.yml  │──► GitHub repo                            │
│  │ (triggered after)│    (static HTML)                          │
│  └────────┬─────────┘                                           │
│           │                                                     │
│           ▼                                                     │
│  ┌──────────────────┐                                           │
│  │ verify-dains.yml │   Runs 30 min after scan                  │
│  │                  │                                           │
│  │  Layer 1: Check workflow status                              │
│  │  Layer 2: Query Supabase for today's scan                    │
│  │  Layer 3: HTTP GET live URL, verify content                  │
│  │                                                              │
│  │  If any fail → retry workflows                               │
│  │  If still fail → publish fallback + ALERT                    │
│  └──────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Verification Logic

### Layer 1: Workflow Status Check
- Query GitHub API for today's daily-ai-news-scan run
- Status must be "success"
- If "failure" or "cancelled" → trigger retry

### Layer 2: Supabase Data Check
- Query: `SELECT * FROM published_posts WHERE slug = 'daily-ai-news-scan-YYYY-MM-DD'`
- Must return exactly 1 row
- Content must be non-empty (> 500 chars)
- If missing or empty → trigger retry of build-scan.js

### Layer 3: End-to-End HTTP Check
- GET `https://victordelrosal.com/daily-ai-news-scan-YYYY-MM-DD/`
- Response must be 200 (not 404)
- Body must contain "Executive Summary" (proves real content, not error page)
- If 404 → trigger build-waves.yml
- If 200 but wrong content → alert (unusual, needs investigation)

### Retry Logic
- Max 2 retries per workflow
- Wait 5 minutes between retries
- If all retries exhausted → proceed to fallback

### Fallback: Publish Placeholder
If verification fails after all retries:
1. Insert minimal record into Supabase with:
   - Title: "Daily AI News Scan — [Date]"
   - Content: "Today's automated scan encountered an issue. Check back later or view yesterday's scan."
2. Trigger build-waves.yml to generate static page
3. This ensures no 404 - readers see something

## Alerting

Email alerts via existing Resend integration.

### Critical Alerts (Immediate)

| Trigger | Subject Line |
|---------|-------------|
| All retries failed, fallback published | 🚨 DAINS FAILED - Fallback published for [date] |
| Live URL returns 404 after all retries | 🚨 DAINS 404 - Page not accessible for [date] |
| Supabase unreachable | 🚨 DAINS - Cannot reach database |

Email body includes:
- What failed (which layer)
- Error messages from logs
- Direct links to: workflow run, Supabase dashboard, live URL
- What automatic action was taken (retries, fallback)

### Minor Alerts (Morning Digest at 7:45 AM Dublin)

| Trigger | Included in digest |
|---------|-------------------|
| Workflow failed but retry succeeded | ⚠️ Retry needed: [workflow] failed, succeeded on attempt 2 |
| RSS source returned 0 items | ⚠️ Source issue: [source name] returned no items |
| Fewer than 5 items total (low news day) | ℹ️ Low volume: Only [N] items found |

## Schedule & Timezone Handling

7am Dublin changes with daylight saving:
- Winter (GMT): 7am Dublin = 07:00 UTC
- Summer (IST): 7am Dublin = 06:00 UTC

**Solution:** Two cron schedules. Both fire, but early-exit if scan already exists.

| Workflow | Schedule (UTC) | Dublin Time |
|----------|---------------|-------------|
| daily-ai-news-scan.yml | `0 6,7 * * *` | 7am (summer), 7am (winter) |
| verify-dains.yml | `30 6,7 * * *` | 7:30am |
| Digest email | `45 7,8 * * *` | 7:45am (if issues exist) |

## Files to Create/Modify

### New: `.github/workflows/verify-dains.yml`
- Three-layer verification
- Auto-retry logic
- Fallback placeholder publishing
- Alert sending via Resend

### New: `ai-daily-intel/send-alert.js`
- Utility to send emails via Resend
- Handles both critical and digest alerts
- Stores digest items in memory/file for batching

### Modified: `.github/workflows/daily-ai-news-scan.yml`
- Change schedule from `0 5 * * *` to `0 6,7 * * *`
- Workflow already handles "scan exists" gracefully

### Modified: `ai-daily-intel/build-scan.js`
- Add explicit early exit if today's scan exists
- Log message: "Scan for [date] already exists, skipping"

## Failure Scenarios Covered

| Scenario | Detection | Response |
|----------|-----------|----------|
| RSS sources all fail | Layer 1 (workflow fails) | Retry 2x → fallback → alert |
| Anthropic API down | Layer 1 (workflow fails) | Retry 2x → fallback → alert |
| Supabase insert fails | Layer 2 (no row found) | Retry 2x → fallback → alert |
| build-waves.yml bug | Layer 3 (404 on live URL) | Trigger build-waves → alert |
| GitHub Pages deploy slow | Layer 3 (404 at 7:30) | Re-check at 7:45 before alerting |
| GitHub Actions outage | All layers fail | Fallback → alert |
| Everything works | All layers pass | No alert |
| Transient failure, retry worked | Layer 1-3 | Morning digest only |

## Success Criteria

1. **Zero silent failures** - Every failure produces an email
2. **Zero 404s** - Fallback ensures readers always see a page
3. **Minimal false alarms** - Retries handle transient issues automatically
4. **Timezone-proof** - Works correctly across DST transitions
5. **Self-documenting** - Alert emails contain enough context to diagnose

## Dependencies

- `RESEND_API_KEY` - Already configured in GitHub secrets
- `SUPABASE_URL` - Already configured
- `SUPABASE_ANON_KEY` - Already configured
- `GITHUB_TOKEN` - Automatic in GitHub Actions (for workflow re-triggering)

## Implementation Notes

- verify-dains.yml should use `workflow_dispatch` to trigger retries of other workflows
- Digest emails need a way to accumulate issues - simplest is a GitHub artifact or Supabase table
- Consider adding a simple status badge to README showing last successful run
