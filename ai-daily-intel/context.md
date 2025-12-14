# Context: Daily AI Briefing Automation

## What This Is

This repository implements a **fully automated daily AI intelligence briefing system** for Victor del Rosal.

The system ingests **live online AI news**, synthesises it into a **high-signal executive briefing**, publishes it to Victor’s website by early morning, and distributes a distilled version to LinkedIn later the same day.

This is not a news scraper.
This is not a content farm.
This is not a generic summariser.

It is a **curated intelligence product** designed for decision-makers navigating the AI transition.

---

## Who This Is For

The output audience is:
- Business leaders
- Educators
- Builders and founders
- Policy-aware practitioners

The tone is:
- Calm
- Analytical
- Grounded
- Thoughtful

The system writes *as Victor*, not *about Victor*.

---

## Why This Exists

Victor currently consumes multiple AI information streams daily. This system externalises that cognition into an automated workflow that:

1. Filters noise before synthesis
2. Preserves source attribution and accountability
3. Produces consistent, daily intellectual output
4. Compounds trust over time

The value is not speed or novelty.
The value is **reliable sense-making**.

---

## Core Output Contract

Every successful run produces:

1. **One published blog post** titled  
   `AI Briefing — <Date>`

2. A structured briefing containing:
   - Executive Summary (50–70 words)
   - 3–5 Key Developments with attribution
   - A reflective “Victor’s Take” section

3. **One LinkedIn post** derived from the briefing, published later the same day

If any of these fail, the run is considered failed.

---

## What Counts as “AI News”

AI news includes:
- Frontier model releases
- Major research breakthroughs
- AI policy and regulation
- Enterprise and platform-level AI moves
- Meaningful shifts in education or labour due to AI

It does **not** include:
- Speculative hype
- Startup gossip
- “X will replace Y” hot takes
- Engagement bait
- Rewritten press releases with no substance

---

## Source Philosophy

Sources are intentionally conservative and biased toward:
- Primary announcements
- Credible research
- Established institutions

Duplicate reporting is expected and must be handled explicitly.

The system must prefer:
1. Original sources
2. Official announcements
3. Primary research

Secondary commentary is acceptable only when it adds genuine analysis.

---

## Determinism Over Creativity

This system optimises for:
- Consistency
- Repeatability
- Predictability

It does **not** optimise for:
- Viral language
- Maximum engagement
- Creative novelty

The LLM is used as a **synthesis engine**, not an authorial agent.

---

## Attribution Is Mandatory

Every factual claim in the briefing must be traceable to a source URL.

If attribution is missing, the output is invalid.

If sources conflict, the conflict must be acknowledged explicitly.

Hallucinated sources are a hard failure.

---

## Timing Constraints

- News window: previous 24 hours
- Briefing published by: 06:30 Europe/Dublin
- LinkedIn post published at: 11:00 Europe/Dublin

Late sources are ignored until the next run.

---

## Failure Is Visible

Silent failure is unacceptable.

The system must:
- Detect insufficient inputs
- Detect extraction failures
- Alert Victor when thresholds are breached

A “partial” briefing is worse than no briefing.

---

## What the Agent Must Not Do

The implementing agent must NOT:
- Expand scope beyond AI news
- Introduce new publishing channels
- Optimise away deduplication
- Remove attribution for brevity
- Change tone toward marketing or promotion
- Add emojis, hashtags, or stylistic flourishes
- Reorder sections or rename them

If unsure, preserve structure and ask for clarification.

---

## Success Criteria

This system is successful if:
- Victor can stop manually checking AI news daily
- The briefing remains trustworthy over months
- Readers learn something meaningful most days
- The system runs unattended with visible guardrails

Longevity beats cleverness.

---

## Mental Model

Think of this system as:
> “A quiet, reliable intelligence analyst who shows up every morning, does the reading, and leaves a clear briefing on the desk.”

If the implementation violates that metaphor, it is wrong.

---
