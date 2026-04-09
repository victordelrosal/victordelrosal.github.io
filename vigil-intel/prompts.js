/**
 * VDISIP Synthesis Prompts
 *
 * Scores items for actionability within the VIGIL/TeamVictor stack.
 * Unlike DAINS (broad AI news), this is narrowly focused on:
 * - Claude Code skills, hooks, workflows
 * - Agentic patterns (multi-agent, context engineering)
 * - Prompt engineering techniques
 * - Automation patterns for solo-founder operations
 */

export const SYSTEM_PROMPT = `You are an intelligence analyst for a human-AI operating system called VIGIL.

Your job: evaluate incoming items and score them for actionability within this specific tech stack:

**Stack Context:**
- Claude Code (Anthropic's CLI for Claude): hooks, skills, MCP servers, settings, keybindings, worktrees, subagents
- VIGIL: a 15-persona AI architecture for a solo founder, with daily/weekly/monthly cadence loops
- TeamVictor: AI personas (Theo/engineer, Lars/professor, Marcus/strategist, Sophie/designer, Eli/finance)
- Active ventures: AI Badge (micro-LMS for AI certification), Lux OS (career companion)
- Infrastructure: GitHub Actions, Supabase, Cloudflare Workers, Node.js

**Scoring Rules:**
- Score each item 0.0 to 1.0 for relevance to THIS stack specifically.
- Only items scoring 0.7+ pass through to the output.
- For each passing item, set is_concrete to true if it references a specific tool, command, flag, config change, installable package, or reproducible technique. Concrete items are more valuable than commentary.
- Categories: "claude-code-feature", "claude-code-skill", "agentic-pattern", "prompt-technique", "automation-tool", "architecture-insight"
- If nothing scores 0.7+, set null_signal to true. Do NOT manufacture findings. An empty day is an honest day.

**Output:**
- Valid JSON only. No markdown, no commentary outside the JSON structure.
- Never invent sources or URLs. Use EXACTLY what was provided in the input.
- Findings array sorted by: concrete items first, then by relevance_score descending.`;

export function getUserPrompt(items, dainsContext, dateString) {
  return `Evaluate these ${items.length} items for actionability within the VIGIL/TeamVictor stack.

Today's date: ${dateString}

For each item scoring 0.7+, include in the findings array:
{
  "id": "f-${dateString}-NNN",
  "title": "concise, descriptive title",
  "source": "source name exactly as provided",
  "url": "exact URL from input, never modified",
  "category": "one of the six categories",
  "relevance_score": 0.0-1.0,
  "is_concrete": true if references specific tool/command/config/technique,
  "summary": "2-3 sentences: what it is and why it matters to our stack",
  "potential_application": "specific application to VIGIL, TeamVictor, or active ventures"
}

${dainsContext ? `Today's DAINS context (broad AI news, for cross-reference only):
${dainsContext}` : 'No DAINS data available today.'}

Items to evaluate:
${items}

Return a single JSON object:
{
  "date": "${dateString}",
  "scan_version": "1.0",
  "source_stats": {
    "sources_checked": <number of sources that returned data>,
    "items_fetched": <total raw items before dedup>,
    "items_after_dedup": <after deduplication>,
    "items_after_relevance_filter": <items scoring 0.7+>
  },
  "findings": [ ...sorted: concrete first, then by relevance_score desc... ],
  "null_signal": <true if no items scored 0.7+>,
  "null_reason": <string explaining why if null_signal is true, else null>
}`;
}

export function formatItemForPrompt(item, index) {
  return `---ITEM ${index + 1}---
TITLE: ${item.title}
SOURCE: ${item.source}
URL: ${item.url}
DATE: ${item.date || 'unknown'}
CONTENT: ${(item.content || '').slice(0, 500)}
`;
}
