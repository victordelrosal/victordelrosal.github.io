# Newsletter Aggregation for DAINS

**Date:** 2024-12-22
**Status:** Approved

## Overview

Aggregate 14 AI newsletters into DAINS (Daily AI News Scan) alongside existing RSS sources. Newsletters provide editorial signal (importance ranking), RSS provides primary sources.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEWSLETTER INGESTION                         │
├─────────────────────────────────────────────────────────────────┤
│  14 Newsletters → ainews@vdr.me → Cloudflare Email Worker       │
│                                          ↓                      │
│                                   Claude Haiku extracts:        │
│                                   • headline                    │
│                                   • summary                     │
│                                   • source_url                  │
│                                   • entities                    │
│                                          ↓                      │
│                                   Supabase: newsletter_items    │
└─────────────────────────────────────────────────────────────────┘
                                   ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AGGREGATION (07:00 UTC)                      │
├─────────────────────────────────────────────────────────────────┤
│  1. Fetch newsletter_items since last run                       │
│  2. Fetch RSS items (existing sources.json)                     │
│  3. Dedupe & cluster by entity/headline similarity              │
│  4. Count hits per cluster (newsletter mentions)                │
│  5. Rank clusters by hit count                                  │
│  6. Match to RSS primary sources where possible                 │
│  7. Claude synthesizes Top 10 (tiered format)                   │
│  8. Publish to Supabase → build-waves → verify                  │
└─────────────────────────────────────────────────────────────────┘
```

## Newsletter Sources (14)

| Newsletter | Sender Email |
|------------|--------------|
| AI Fire | aifire@mail.beehiiv.com |
| The Neuron | theneuron@newsletter.theneurondaily.com |
| The Rundown AI | news@daily.therundown.ai |
| Rohan's Bytes | rohanpaul+daily-ai-newsletter@substack.com |
| Techpresso | techpresso@dupple.com |
| 1440 Daily Digest | dailydigest@email.join1440.com |
| IBM Think Newsletter | IBM@email.ibm.com |
| AI for Good | mailings@aiforgood.itu.int |
| State of AI | stateai@substack.com |
| The Pragmatic Engineer | pragmaticengineer+deepdives@substack.com |
| Exponential View | exponentialview@substack.com |
| David Shapiro | daveshap@substack.com |
| Future Blueprint | futureblueprint@mail.beehiiv.com |
| Superhuman AI | superhuman@mail.joinsuperhuman.ai |

## Data Model

**Table: `newsletter_items`** (already deployed)

```sql
CREATE TABLE newsletter_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_name TEXT NOT NULL,
  email_received_at TIMESTAMPTZ NOT NULL,
  email_subject TEXT,
  headline TEXT NOT NULL,
  summary TEXT,
  source_url TEXT,
  entities JSONB DEFAULT '[]'::jsonb,
  processed_at TIMESTAMPTZ,
  dains_slug TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  raw_content TEXT
);
```

## Output Format

**Tiered display (Top 10, minimum 5):**

- **Top 3:** Full treatment (headline, paragraph, primary source, "via" newsletters)
- **#4-7:** One-liner + subtitle
- **#8-10:** One-liners only

**Ranking logic:** Stories ranked by newsletter hit count. RSS provides primary sources but doesn't affect ranking.

**Attribution:** Multi-source — shows primary source + "Via: Newsletter1, Newsletter2, ..."

## Components to Build

| # | Component | Location | Purpose |
|---|-----------|----------|---------|
| 1 | Cloudflare Email Worker | Worker script | Receives emails, parses with Claude, stores to Supabase |
| 2 | Email routing rule | Cloudflare Dashboard | Routes ainews@vdr.me → Worker |
| 3 | Newsletter registry | `ai-daily-intel/newsletters.json` | Maps sender emails → newsletter names |
| 4 | Updated build-scan.js | `ai-daily-intel/build-scan.js` | Fetches newsletter_items + RSS, clusters, ranks, synthesizes |
| 5 | Updated prompts.js | `ai-daily-intel/prompts.js` | New tiered output format with hit counts |

## Secrets Required

**Cloudflare Worker:**
- `ANTHROPIC_API_KEY` — Claude Haiku for parsing
- `SUPABASE_URL` — https://azzzrjnqgkqwpqnroost.supabase.co
- `SUPABASE_SERVICE_KEY` — service role key for inserts

## Key Decisions

1. **Email access:** Cloudflare Email Workers (ainews@vdr.me direct signup)
2. **Storage:** Supabase (consistent with existing data layer)
3. **RSS integration:** Combined — newsletters rank, RSS provides primary sources
4. **Parsing:** Claude Haiku (handles varied HTML formats)
5. **Time window:** Since last successful run (robust to retries)
6. **Minimum stories:** 5 (aim for 10)
7. **Attribution:** Multi-source (primary + via newsletters)

## Sample Output

```html
<h1>Daily AI Intel — December 22, 2024</h1>

<h2>Executive Summary</h2>
<p>Today's top signal: OpenAI announces GPT-5 with significant
reasoning improvements. Also notable: EU AI Act enforcement begins,
Google releases Gemini 2.0. Full breakdown below.</p>

<h2>Top Stories</h2>

<h3>1. OpenAI announces GPT-5 <span class="hits">(12 sources)</span></h3>
<p>Full paragraph with details...</p>
<p><strong>Source:</strong> <a href="...">OpenAI Blog</a><br/>
<em>Via: The Rundown, AI Fire, The Neuron +9 more</em></p>

<h3>2. EU AI Act enforcement begins <span class="hits">(10 sources)</span></h3>
<p>Full paragraph...</p>

<h3>3. Google releases Gemini 2.0 <span class="hits">(8 sources)</span></h3>
<p>Full paragraph...</p>

<h2>Notable</h2>
<p><strong>4. Anthropic raises $2B</strong> — Valuation hits $60B. <em>(6)</em></p>
<p><strong>5. Meta open-sources Llama 4</strong> — Available on Hugging Face. <em>(5)</em></p>
<p><strong>6. Microsoft Copilot gets agents</strong> — Enterprise rollout Q1. <em>(4)</em></p>
<p><strong>7. AI chip shortage easing</strong> — TSMC ramps production. <em>(4)</em></p>

<h2>Also Noted</h2>
<p>8. Runway releases Gen-4 (3) · 9. Stability AI pivots (2) · 10. New safety benchmark (2)</p>
```
