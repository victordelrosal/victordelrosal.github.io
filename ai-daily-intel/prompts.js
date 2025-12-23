/**
 * Claude prompts for Daily AI News Scan (DAINS)
 */

export const SYSTEM_PROMPT = `You are an automated AI news aggregator producing a daily news scan for victordelrosal.com.

Rules:
- Signal over noise. Hype is failure.
- Use ONLY the stories provided. Never invent sources.
- Every story MUST include source attribution.
- Tone: factual, analytical, no editorializing.
- This is automated - do not pretend to be human.
- Output clean, valid HTML only. No markdown.
- Follow the tiered format exactly.`;

export function getUserPrompt(date, formattedDate, formattedStories, isNewsletterRanked) {
  const rankingNote = isNewsletterRanked
    ? 'Stories are ranked by newsletter coverage. Higher coverage = more important.'
    : 'Stories are from RSS feeds only (newsletter data unavailable).';

  return `Today's date: ${date}

${rankingNote}

Here are today's top AI stories:

${formattedStories}

Write a briefing with this EXACT structure in clean HTML:

<h1>[TOP STORY HEADLINE]</h1>
<p class="subtitle">Daily AI News Scan — ${formattedDate}</p>

<h2>Executive Summary</h2>
<p>70-100 words. Lead with the #1 story, mention #2 and #3. Set context for today's news.</p>

<h2>Top Stories</h2>

<!-- Stories #1-3: Full treatment -->
<div class="story story-top">
<h3>1. [Headline]</h3>
<p>Full paragraph (3-4 sentences) with details, context, and implications.</p>
<p class="attribution"><strong>Source:</strong> <a href="[URL]">[Publisher]</a></p>
</div>

<!-- Repeat for #2 and #3 -->

<h2>Notable</h2>

<!-- Stories #4-7: One-liner + summary -->
<p><strong>4. [Headline]</strong> — [One-sentence summary].</p>
<p><strong>5. [Headline]</strong> — [One-sentence summary].</p>
<p><strong>6. [Headline]</strong> — [One-sentence summary].</p>
<p><strong>7. [Headline]</strong> — [One-sentence summary].</p>

<h2>Also Noted</h2>

<!-- Stories #8-10: Each on its own line with WHY it matters -->
<p><strong>8. [Headline]</strong> — [Why this is relevant to AI practitioners/industry].</p>
<p><strong>9. [Headline]</strong> — [Why this is relevant to AI practitioners/industry].</p>
<p><strong>10. [Headline]</strong> — [Why this is relevant to AI practitioners/industry].</p>

<hr>
<p><em>Compiled from 14 newsletters + 24 RSS sources at 07:00 GMT. <a href="https://victordelrosal.com/daily-ai-news-scan-about/">How this works</a></em></p>

Important:
- The <h1> MUST be the headline of story #1 (the top story) - NOT "Daily AI News Scan"
- "Daily AI News Scan — [Date]" goes in the subtitle <p class="subtitle">
- Do NOT include source counts like "(X sources)" anywhere - we removed this
- Output ONLY valid HTML, no markdown
- If fewer than 10 stories, adjust sections (min 5 stories)
- Source link should be primary source when available
- For "Also Noted" stories, explain WHY each story matters to AI practitioners`;
}

export function formatStoriesForPrompt(stories, isNewsletterRanked) {
  return stories.map((story, index) => {
    const hitCount = story.hits ? story.hits.length : 0;
    const newsletters = story.hits ? story.hits.map(h => h.newsletter).join(', ') : 'RSS only';

    const primarySource = story.primarySource
      ? `PRIMARY SOURCE: ${story.primarySource.publisher} - ${story.primarySource.url}`
      : 'PRIMARY SOURCE: Not identified';

    // Get best summary from hits or use story summary
    const summaries = story.hits && story.hits.length > 0
      ? story.hits.map(h => h.summary).filter(Boolean).join(' | ')
      : story.summary || 'No summary available';

    return `---STORY ${index + 1}---
HEADLINE: ${story.headline}
HIT COUNT: ${hitCount} newsletters
NEWSLETTERS: ${newsletters}
${primarySource}
ENTITIES: ${(story.entities || []).join(', ') || 'None identified'}
SUMMARIES: ${summaries}
`;
  }).join('\n');
}

// Keep old function for backwards compatibility (RSS-only fallback)
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
