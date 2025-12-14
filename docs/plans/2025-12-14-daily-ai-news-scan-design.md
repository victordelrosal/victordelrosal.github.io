# Daily AI News Scan - Design Document

**Date**: 2025-12-14
**Status**: Approved

---

## Overview

A fully automated daily AI intelligence scan that fetches news from RSS feeds and APIs, synthesizes it using Claude, and publishes as a wave on victordelrosal.com.

**Key principle**: Transparent automation. No pretense of human curation.

---

## System Specifications

| Component | Details |
|-----------|---------|
| **Name** | Daily AI News Scan |
| **URL Pattern** | `/daily-ai-news-scan-yyyy-mm-dd/` |
| **Schedule** | 5:00 AM GMT daily |
| **Platform** | GitHub Actions (free) |
| **Sources** | ~15 RSS feeds + NewsAPI |
| **LLM** | Claude Sonnet 4 |
| **Output** | Wave in Supabase → static HTML via build-waves.js |
| **Alerts** | GitHub's built-in failure notifications |

---

## Architecture

```
5:00 AM GMT
    ↓
GitHub Actions triggers daily-ai-news-scan.yml
    ↓
build-scan.js runs:
    ├── Load sources from sources.json
    ├── Fetch RSS feeds (rss-parser)
    ├── Fetch NewsAPI (HTTP)
    ├── Filter to last 24 hours
    ├── Normalize to unified schema
    ├── Deduplicate (URL + fuzzy title)
    ├── Call Claude Sonnet 4 for synthesis
    └── Insert into Supabase published_posts
    ↓
Trigger build-waves.yml
    ↓
Static page live at /daily-ai-news-scan-YYYY-MM-DD/
```

---

## File Structure

```
/ai-daily-intel/
  build-scan.js        # Main orchestration script
  sources.json         # Configurable source registry
  prompts.js           # System/user prompts for Claude
  package.json         # Dependencies (rss-parser, @anthropic-ai/sdk)

/.github/workflows/
  daily-ai-news-scan.yml  # Scheduled workflow

/daily-ai-news-scan-about/
  index.html           # Static transparency page
```

---

## Source Registry

### Tier 1 - Primary Sources (RSS)
- OpenAI Blog
- Anthropic News/Research
- Google DeepMind Blog
- Google AI Blog
- Nvidia AI Blog

### Tier 2 - Research (RSS)
- arXiv cs.AI
- arXiv cs.LG

### Tier 3 - Quality Media (RSS)
- MIT Technology Review (AI section)
- Wired (AI)
- The Batch (deeplearning.ai)
- Stratechery (free posts)

### Tier 4 - News Aggregation
- Google News RSS queries:
  - "frontier AI models"
  - "AI regulation"
  - "generative AI enterprise"
  - "AI safety"
- NewsAPI queries (optional expansion)

---

## Deduplication Strategy

1. **Exact URL match** - Same URL = same story, keep highest priority
2. **Fuzzy title similarity** - >80% word overlap = duplicate, keep highest priority source

Priority order: Tier 1 > Tier 2 > Tier 3 > Tier 4

---

## Claude Synthesis

### System Prompt
```
You are an automated AI news scanner producing a daily intelligence
scan for victordelrosal.com.

Rules:
- Signal over noise. Hype is failure.
- Use ONLY the items provided. Never invent sources.
- Every development MUST include a source URL.
- Prefer primary sources when duplicates exist.
- If sources conflict, acknowledge it explicitly.
- Tone: factual, analytical, no editorializing.
- This is automated - do not pretend to be human.
```

### Output Structure
```
1. HEADLINE: "Daily AI News Scan — December 14, 2025"

2. EXECUTIVE SUMMARY (50-70 words)
   The 2-3 most significant developments.

3. KEY DEVELOPMENTS (3-5 items)
   For each:
   - Bold title
   - 2-3 sentence factual summary
   - Source: [Publisher](URL)

4. TRANSPARENCY FOOTER
   "This scan is automatically generated at 05:00 GMT daily.
   Sources are fetched, deduplicated, and synthesized by AI.
   No human editorial review. [How this works](/daily-ai-news-scan-about/)"
```

Total: ~400-500 words

---

## GitHub Actions Workflow

```yaml
name: Daily AI News Scan

on:
  schedule:
    - cron: '0 5 * * *'  # 5:00 AM UTC (GMT)
  workflow_dispatch:      # Manual trigger for testing

jobs:
  build-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci
        working-directory: ai-daily-intel

      - name: Build daily scan
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          NEWS_API_KEY: ${{ secrets.NEWS_API_KEY }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node build-scan.js
        working-directory: ai-daily-intel

      - name: Trigger wave build
        run: |
          curl -X POST \
            -H "Authorization: token ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github.v3+json" \
            https://api.github.com/repos/${{ github.repository }}/dispatches \
            -d '{"event_type": "wave_published"}'
```

---

## Supabase Integration

Insert into existing `published_posts` table:

```javascript
const scanData = {
  slug: `daily-ai-news-scan-${dateString}`,
  title: `Daily AI News Scan — ${formattedDate}`,
  content: htmlContent,
  published_at: new Date().toISOString(),
};

await supabase.from('published_posts').insert(scanData);
```

Reuses existing build-waves.js for static page generation.

---

## Secrets Required

Add to GitHub repository settings:
- `ANTHROPIC_API_KEY` - Claude API key
- `NEWS_API_KEY` - NewsAPI.org key (optional, 100 free/day)
- `SUPABASE_URL` - Already exists
- `SUPABASE_ANON_KEY` - Already exists

---

## Transparency Page

Static page at `/daily-ai-news-scan-about/` explaining:
- Fully automated, no human review
- Source list and fetching process
- Deduplication and AI synthesis steps
- Limitations and caveats
- Why automation with transparency

Linked from every scan's footer.

---

## Future Enhancements (Not MVP)

- LinkedIn distribution at 11:00 AM
- Email digest to subscribers
- Source performance tracking
- Manual override/skip capability

---

## Success Criteria

1. Scan publishes reliably at 5:00 AM GMT daily
2. Content is factual with proper attribution
3. Failures are visible via GitHub notifications
4. System runs unattended with no false claims of human curation
