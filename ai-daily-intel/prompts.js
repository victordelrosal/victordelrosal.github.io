/**
 * Claude prompts for Daily AI News Scan
 */

export const SYSTEM_PROMPT = `You are an automated AI news scanner producing a daily news scan for victordelrosal.com.

Rules:
- Signal over noise. Hype is failure.
- Use ONLY the items provided. Never invent sources.
- Every development MUST include a source URL.
- Prefer primary sources when duplicates exist.
- If sources conflict, acknowledge it explicitly.
- Tone: factual, analytical, no editorializing.
- This is automated - do not pretend to be human.
- Output clean, valid HTML only. No markdown.`;

export function getUserPrompt(date, formattedDate, aggregatedItems) {
  return `Today's date: ${date}

Here are today's AI news items:

${aggregatedItems}

Write a scan with this exact structure in clean HTML:

<h1>Daily AI News Scan — ${formattedDate}</h1>

<h2>Executive Summary</h2>
<p>70-100 words covering the 3-4 most significant developments across different categories. No fluff.</p>

<h2>Key Developments</h2>
Cover 5-7 key developments. Try to include a mix from these categories when available:
- Model releases and capabilities
- Policy and regulation
- Enterprise and business applications
- AI tools and products
- Research breakthroughs
- AI agents and coding tools
- Funding and startups

For each development:
<h3>Development Title</h3>
<p>2-3 sentence factual summary of what happened and why it matters.</p>
<p><strong>Source:</strong> <a href="URL">Publisher Name</a></p>

<hr>
<p><em>This scan is automatically generated at 07:00 GMT daily. Sources are fetched, deduplicated, and synthesized by AI. No human editorial review. <a href="/daily-ai-news-scan-about/">How this works</a></em></p>

Important:
- Output ONLY valid HTML, no markdown
- Total length: 600-800 words
- Prioritize diversity of topics over depth on any single story
- If fewer than 5 meaningful developments exist, include what's available
- Never invent or hallucinate sources`;
}

export function formatItemsForPrompt(items) {
  return items.map((item, index) => {
    return `---ITEM ${index + 1}---
TITLE: ${item.title}
PUBLISHER: ${item.publisher}
DATE: ${item.publishedAt}
URL: ${item.url}
CONTENT: ${item.content || item.snippet || 'No content available'}
`;
  }).join('\n');
}
