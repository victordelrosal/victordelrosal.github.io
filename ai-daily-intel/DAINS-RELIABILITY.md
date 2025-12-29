# DAINS Reliability System

**Daily AI News Scan (DAINS)** - Automated reliability improvements implemented December 29, 2025.

---

## Incident: December 29, 2025

### What Happened
DAINS failed to run automatically. Two scheduled runs (6:10 AM and 7:07 AM UTC) both failed silently - no email alert was received.

### Root Causes Identified

1. **Invalid Anthropic API Key** - The `ANTHROPIC_API_KEY` GitHub secret had expired/become invalid (last updated Dec 14)
2. **Missing Workflow Permissions** - `verify-dains.yml` lacked `actions: write` permission to trigger retry workflows
3. **Silent Failure Cascade** - Verification tried to retry, crashed due to permissions, no fallback published, no alert sent

### Resolution
- Updated Anthropic API key in GitHub Secrets
- Added permissions to verify-dains.yml
- Added fail-safe emergency alert
- Ran DAINS manually to publish Dec 29 scan

---

## Reliability Architecture

### Workflow Schedule

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| **DAINS Health Check** | 5pm daily (16:00/17:00 UTC) | Validates Anthropic API key before morning run |
| **Daily AI News Scan** | 6-7am daily (06:00/07:00 UTC) | Generates the daily scan |
| **Verify DAINS** | 6:30-7:30am daily | Validates success, retries if needed, publishes fallback |
| **DAINS Reminders** | June 29, 2025 | 6-month API key rotation reminder |

### Protection Layers

```
5pm: Health Check validates API key
     ↓ (if invalid) → Email alert, 12+ hours to fix

7am: DAINS runs
     ↓ (if fails) → Verify DAINS detects and retries

7:30am: Verify DAINS checks 3 layers:
     Layer 1: Workflow status (did it succeed?)
     Layer 2: Supabase data (is content published?)
     Layer 3: Live URL (is page accessible?)
     ↓ (if all fail after retry) → Publishes fallback + email alert
     ↓ (if workflow crashes) → Emergency email alert
```

### Alert Conditions

You only receive emails when:
- API key is invalid (5pm health check)
- DAINS fails after all retries (verification)
- Verification workflow crashes (fail-safe)
- API key rotation reminder (every 6 months)

**No news = good news.**

---

## Files Modified

### `.github/workflows/verify-dains.yml`
- Added `permissions: actions: write` to allow triggering retry workflows
- Added fail-safe emergency alert step that fires on any workflow failure

### `.github/workflows/dains-health-check.yml` (NEW)
- Daily 5pm check that validates Anthropic API key
- Makes minimal API call to test authentication
- Sends alert only if key is invalid

### `.github/workflows/dains-reminders.yml` (NEW)
- Test alert function for verifying email delivery
- 6-month API key rotation reminder (scheduled June 29, 2025)

### `ai-daily-intel/prompts.js`
- Fixed URL handling to provide ONE explicit URL per story
- Changed from blob format (`url1 | url2 | url3`) to explicit `**USE THIS URL**` field
- Updated prompt instructions to require Claude use exact provided URLs

---

## URL Fix Details

### Problem
Claude was outputting `href="#"` placeholder links because URLs were passed ambiguously.

**Before:**
```
PRIMARY SOURCE: Not identified
SOURCE URLS FROM NEWSLETTERS: url1 | url2 | url3
```

**After:**
```
**USE THIS URL**: https://example.com/article
**SOURCE NAME**: TechXplore
```

### Priority Order for URL Selection
1. Primary source from RSS match (most authoritative)
2. First valid URL from newsletter hits
3. If no URL available, outputs explicit instruction to use `#`

---

## GitHub Secrets Required

| Secret | Purpose | Rotation |
|--------|---------|----------|
| `ANTHROPIC_API_KEY` | Claude API for synthesis | Every 6 months |
| `SUPABASE_URL` | Database connection | Rarely changes |
| `SUPABASE_ANON_KEY` | Database authentication | When rotated |
| `RESEND_API_KEY` | Email delivery for alerts | Rarely changes |
| `ALERT_EMAIL` | Destination for alerts | Update if needed |

---

## Testing

### Test Alert System
```bash
gh workflow run "DAINS Reminders" -f action=test-alert
```

### Test Health Check
```bash
gh workflow run "DAINS Health Check"
```

### Test Full Verification
```bash
gh workflow run "Verify DAINS"
```

### Manual DAINS Run
```bash
gh workflow run "Daily AI News Scan"
```

---

## Maintenance Checklist

### Every 6 Months (Reminder will be sent)
1. Go to [Anthropic Console](https://console.anthropic.com/settings/keys)
2. Create new API key
3. Update GitHub secret: Repository Settings → Secrets → `ANTHROPIC_API_KEY`
4. Delete old key from Anthropic Console
5. Run health check to verify: `gh workflow run "DAINS Health Check"`

### If Alert Received
1. Check workflow logs: `gh run list --workflow="Daily AI News Scan"`
2. View failed run: `gh run view <run_id> --log-failed`
3. Fix the issue (usually API key or permissions)
4. Re-run manually: `gh workflow run "Daily AI News Scan"`

---

## Contact

For issues with DAINS reliability, check:
1. GitHub Actions logs
2. Supabase dashboard for data issues
3. Anthropic Console for API key status
