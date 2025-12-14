Victor, good instinct. This is exactly the right moment to freeze the design into artefacts your coding agent can execute against without interpretation drift.

Below are **two clean `.md` documents**, intentionally structured for **agent implementation**, not human prose. You can copy-paste each into your repo as-is.

I have made **no architectural leaps** beyond what we discussed. This is a faithful, executable translation.

---

# 📄 `DAILY_AI_BRIEFING_WEB_AUTOMATION.md`

```md
# Definitive Daily AI Briefing Automation (Web-Sourced)

## Purpose

Produce a daily, high-signal AI briefing sourced from live online news, synthesised by an LLM, published to WordPress by 06:30, and distributed to LinkedIn by 11:00 (Europe/Dublin).

This system replaces email newsletter ingestion with structured web-based sources while preserving the existing synthesis, publishing, and distribution logic.

---

## High-Level Architecture

- Orchestrator: Make.com
- Intelligence Source Layer: RSS feeds + APIs + Google News
- Normalisation Layer: schema unification + deduplication
- Synthesis Engine: Claude Sonnet (or GPT-4o)
- CMS Output: WordPress
- Social Distribution: Buffer → LinkedIn
- State & Cache: Make Data Store

---

## Design Principles (Non-Negotiable)

1. Signal over noise. No speculative or recycled hype.
2. Attribution is mandatory. Every insight must include a URL.
3. Determinism over cleverness. Same inputs should yield similar outputs.
4. Failure must be visible. Silent degradation is unacceptable.
5. One daily corpus. Late sources wait until tomorrow.

---

## Phase 1: Source Registry (Do Once)

### Data Store: `BriefingSources`

Each record represents one intelligence source.

**Schema**
- `id` (string)
- `name` (string)
- `type` (enum: rss | api | google_news)
- `url` (string)
- `topic_tags` (array[string])
- `priority` (integer, 1–5)
- `enabled` (boolean)

This store is the single control surface for what the system listens to.

---

## Phase 2: Scenario 1 — Morning Intelligence & Publishing

**Schedule**
- Daily at 06:00
- Timezone: Europe/Dublin

---

### Step 1: Load Active Sources

- Module: Data Store → Search Records
- Filter: `enabled = true`

Output: list of active sources

---

### Step 2: Fetch New Items Per Source

For each source:
- RSS: RSS → Get Items
- API: HTTP → Make Request
- Google News: RSS via query URL

Constraints:
- Only items from last 24 hours
- Max items per source: 10

---

### Step 3: Normalise Items

Convert all items into a unified schema:

```

{
title,
publisher,
published_at,
url,
summary_snippet,
source_name
}

```

Strip tracking parameters from URLs.

---

### Step 4: Deduplication Gate

Apply two filters:
1. Exact URL match
2. Fuzzy title similarity (≥ 85%)

If duplicates exist, keep the highest-priority source.

---

### Step 5: Full-Text Extraction (Best Effort)

For top 10–15 items only:
- Attempt article extraction via readability-style parser
- Fallback to `summary_snippet` if extraction fails

Attach extracted text to item as `content`.

---

### Step 6: Aggregation

Aggregate items into a single text block using this format:

```

TITLE:
PUBLISHER:
DATE:
URL:
CONTENT:

---ITEM BREAK---

```

---

### Step 7: LLM Synthesis

**Model**
- Claude Sonnet 4 (or GPT-4o)

**System Prompt**
```

You are an AI intelligence analyst writing Victor del Rosal's daily AI briefing.

Rules:

* Signal over noise. Hype is failure.
* Use only the items provided.
* Every development must include a source URL.
* Prefer primary sources when duplicates exist.
* Explicitly note conflicts if sources disagree.

```

**User Prompt**
```

Here are today's AI news items:

{{Aggregated Items}}

Write a briefing with this structure:

1. HEADLINE: "AI Briefing — {{date}}"

2. EXECUTIVE SUMMARY (50–70 words)

3. KEY DEVELOPMENTS (3–5 items)

* Title
* 2–3 sentences
* Attribution: [Publisher, Date, URL]

4. VICTOR'S TAKE (60–80 words)
   First person. Reflective. No promotion.

500–700 words total.
Output clean HTML using <h2> headers.

```

---

### Step 8: Publish to WordPress

- Module: WordPress → Create Post
- Title: extracted from briefing
- Content: HTML body
- Status: Published
- Category: AI Briefing

---

### Step 9: Cache LinkedIn Content

- Data Store: `DailyBriefingCache`
- Key: `linkedin_post`
- Value: either
  - Full briefing OR
  - LLM-generated LinkedIn post (preferred)

Optional second LLM call for LinkedIn distillation.

---

## Phase 3: Scenario 2 — LinkedIn Distribution

**Schedule**
- Daily at 11:00
- Timezone: Europe/Dublin

Steps:
1. Retrieve `linkedin_post` from `DailyBriefingCache`
2. Buffer → Create Post
3. Add to queue (Buffer scheduled for 11:00)

---

## Phase 4: Failure Monitoring

### Health Checks
- Items fetched ≥ 5
- Items post-dedup ≥ 3
- Items with extracted content ≥ 2

### Alerts
If thresholds fail:
- Send email alert to Victor

---

## Optional Logging

Append daily metrics to:
- Google Sheets or Notion

Fields:
- Date
- Items fetched
- Items deduped
- Word count
- Success/failure

---

## End State

By 06:30:
- Blog post published

By 11:00:
- LinkedIn post published

System operates unattended with visible failure signals.
```

---

# 📄 `SOURCE_REGISTRY_STARTER.md`

```md
# Starter Source Registry for Daily AI Briefing

This is an initial, conservative source set optimised for signal and reliability.

## Google News (RSS Queries)

- AI regulation Europe
- Frontier AI models
- Enterprise generative AI
- AI education and skills
- AI safety and governance

---

## Vendor & Research Blogs (RSS)

- OpenAI Blog
- Anthropic News
- Google DeepMind Blog
- Microsoft AI Blog
- AWS Machine Learning Blog
- NVIDIA AI Blog

---

## Major Tech & Business Media (RSS)

- MIT Technology Review (AI)
- The Economist (Technology)
- Financial Times (AI / Tech)
- Wired (AI)
- Bloomberg Technology

---

## Research Feeds

- arXiv cs.AI
- arXiv cs.LG
- arXiv cs.CL

---

## Source Governance Rules

1. Prefer primary announcements over commentary.
2. Remove sources that produce >70% duplicate content.
3. Cap total daily items before LLM at 15.
4. Review source list monthly.

This registry is expected to evolve.
```

---

## Final note, and this is me doing my job properly

Do **not** let your agent improvise on deduplication or attribution. That is where these systems quietly rot.

If you want, next step I can produce:

* A **Make.com module-by-module execution spec** for an agent
* Or a **COMPASS-style constraint file** that your coding agent must obey when implementing this workflow

Say the word.
