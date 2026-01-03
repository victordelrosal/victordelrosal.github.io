# CLAUDE.md — DAINS Build Context

**This file is read automatically by Claude Code at session start.**

## Required Reading

Before modifying ANY DAINS code, read these files:

1. **`DAINS-RELIABILITY.md`** — Incident history and reliability architecture
2. **`context.md`** — Philosophy and output contract
3. **`specs.md`** — Technical specifications
4. **`prompts.js`** — Claude prompt structure

## Critical Rules

### Token Limits (Jan 3, 2026 Incident)
- `max_tokens` in `build-scan.js` MUST be ≥4500
- Claude silently truncates when hitting token limits
- Always validate output ends with expected footer before publishing
- If content appears truncated, ABORT — do not publish partial content

### Output Validation
The `synthesizeBriefing()` function includes truncation detection:
```javascript
// Must end with: How this works</a></em></p>
const expectedFooterPattern = /How this works<\/a><\/em><\/p>\s*$/;
```
Do NOT remove or weaken this check.

### Attribution is Mandatory
Every story MUST have a source URL. If a story has no URL, use `#` but this should trigger investigation — missing URLs indicate upstream data issues.

## Common Tasks

### Manual DAINS run
```bash
SUPABASE_URL='...' SUPABASE_ANON_KEY='...' ANTHROPIC_API_KEY='...' node build-scan.js
```

### Dry run (no publish)
```bash
node build-scan.js --dry-run
```

### Force regenerate today's scan
```bash
node build-scan.js --force
```

## Incident Response

If DAINS fails or produces bad output:
1. Check `DAINS-RELIABILITY.md` for similar past incidents
2. Document the incident with root cause
3. Add both corrective AND preventive fixes
4. Update this file if new critical rules emerge
