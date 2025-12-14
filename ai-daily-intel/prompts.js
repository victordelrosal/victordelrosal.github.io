/**
 * Claude prompts for Daily AI Intel Scan
 */

export const SYSTEM_PROMPT = `You are an automated AI news scanner producing a daily intelligence scan for victordelrosal.com.

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

<h1>Daily AI Intel Scan — ${formattedDate}</h1>

<h2>Executive Summary</h2>
<p>50-70 words covering the 2-3 most significant developments. No fluff.</p>

<h2>Key Developments</h2>
For each of 3-5 key developments:
<h3>Development Title</h3>
<p>2-3 sentence factual summary of what happened and why it matters.</p>
<p><strong>Source:</strong> <a href="URL">Publisher Name</a></p>

<hr>
<p><em>This scan is automatically generated at 05:00 GMT daily. Sources are fetched, deduplicated, and synthesized by AI. No human editorial review. <a href="/daily-ai-intel-scan-about/">How this works</a></em></p>

Important:
- Output ONLY valid HTML, no markdown
- Total length: 400-500 words
- If fewer than 3 meaningful developments exist, say so explicitly
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
