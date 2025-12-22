# Newsletter Aggregation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aggregate 14 AI newsletters into DAINS with hit-count ranking and tiered output.

**Architecture:** Cloudflare Email Worker receives newsletters at ainews@vdr.me, parses with Claude Haiku, stores to Supabase. At 07:00 UTC, build-scan.js fetches newsletter items + RSS, clusters by similarity, ranks by hit count, and synthesizes Top 10 in tiered format.

**Tech Stack:** Cloudflare Workers, Supabase, Claude API (Haiku for parsing, Sonnet for synthesis), Node.js

---

## Task 1: Create Newsletter Registry

**Files:**
- Create: `ai-daily-intel/newsletters.json`

**Step 1: Create the newsletter registry file**

```json
{
  "newsletters": [
    {
      "id": "ai-fire",
      "name": "AI Fire",
      "sender": "aifire@mail.beehiiv.com"
    },
    {
      "id": "the-neuron",
      "name": "The Neuron",
      "sender": "theneuron@newsletter.theneurondaily.com"
    },
    {
      "id": "rundown-ai",
      "name": "The Rundown AI",
      "sender": "news@daily.therundown.ai"
    },
    {
      "id": "rohans-bytes",
      "name": "Rohan's Bytes",
      "sender": "rohanpaul+daily-ai-newsletter@substack.com"
    },
    {
      "id": "techpresso",
      "name": "Techpresso",
      "sender": "techpresso@dupple.com"
    },
    {
      "id": "1440-digest",
      "name": "1440 Daily Digest",
      "sender": "dailydigest@email.join1440.com"
    },
    {
      "id": "ibm-think",
      "name": "IBM Think Newsletter",
      "sender": "IBM@email.ibm.com"
    },
    {
      "id": "ai-for-good",
      "name": "AI for Good",
      "sender": "mailings@aiforgood.itu.int"
    },
    {
      "id": "state-of-ai",
      "name": "State of AI",
      "sender": "stateai@substack.com"
    },
    {
      "id": "pragmatic-engineer",
      "name": "The Pragmatic Engineer",
      "sender": "pragmaticengineer+deepdives@substack.com"
    },
    {
      "id": "exponential-view",
      "name": "Exponential View",
      "sender": "exponentialview@substack.com"
    },
    {
      "id": "david-shapiro",
      "name": "David Shapiro",
      "sender": "daveshap@substack.com"
    },
    {
      "id": "future-blueprint",
      "name": "Future Blueprint",
      "sender": "futureblueprint@mail.beehiiv.com"
    },
    {
      "id": "superhuman-ai",
      "name": "Superhuman AI",
      "sender": "superhuman@mail.joinsuperhuman.ai"
    }
  ]
}
```

**Step 2: Commit**

```bash
git add ai-daily-intel/newsletters.json
git commit -m "feat: add newsletter registry for DAINS aggregation"
```

---

## Task 2: Create Cloudflare Email Worker

**Files:**
- Create: `cloudflare-worker/newsletter-ingest/wrangler.toml`
- Create: `cloudflare-worker/newsletter-ingest/src/index.js`
- Create: `cloudflare-worker/newsletter-ingest/package.json`

**Step 1: Create project structure**

```bash
mkdir -p cloudflare-worker/newsletter-ingest/src
```

**Step 2: Create wrangler.toml**

```toml
name = "newsletter-ingest"
main = "src/index.js"
compatibility_date = "2024-12-01"

# Email routing
[triggers]
email = ["ainews@vdr.me"]

# Environment variables (set via wrangler secret)
# ANTHROPIC_API_KEY
# SUPABASE_URL
# SUPABASE_SERVICE_KEY
```

**Step 3: Create package.json**

```json
{
  "name": "newsletter-ingest",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev"
  },
  "devDependencies": {
    "wrangler": "^3.0.0"
  }
}
```

**Step 4: Create src/index.js**

```javascript
/**
 * Cloudflare Email Worker for Newsletter Ingestion
 * Receives newsletters at ainews@vdr.me, parses with Claude, stores to Supabase
 */

// Newsletter sender mapping
const NEWSLETTERS = {
  'aifire@mail.beehiiv.com': 'AI Fire',
  'theneuron@newsletter.theneurondaily.com': 'The Neuron',
  'news@daily.therundown.ai': 'The Rundown AI',
  'rohanpaul+daily-ai-newsletter@substack.com': "Rohan's Bytes",
  'techpresso@dupple.com': 'Techpresso',
  'dailydigest@email.join1440.com': '1440 Daily Digest',
  'IBM@email.ibm.com': 'IBM Think Newsletter',
  'mailings@aiforgood.itu.int': 'AI for Good',
  'stateai@substack.com': 'State of AI',
  'pragmaticengineer+deepdives@substack.com': 'The Pragmatic Engineer',
  'exponentialview@substack.com': 'Exponential View',
  'daveshap@substack.com': 'David Shapiro',
  'futureblueprint@mail.beehiiv.com': 'Future Blueprint',
  'superhuman@mail.joinsuperhuman.ai': 'Superhuman AI',
};

/**
 * Extract sender email from various formats
 */
function extractSenderEmail(from) {
  // Handle "Name <email@domain.com>" format
  const match = from.match(/<([^>]+)>/);
  if (match) return match[1].toLowerCase();
  // Handle plain email
  return from.toLowerCase().trim();
}

/**
 * Identify newsletter from sender
 */
function identifyNewsletter(from) {
  const email = extractSenderEmail(from);

  // Exact match
  if (NEWSLETTERS[email]) {
    return NEWSLETTERS[email];
  }

  // Partial match (for variations)
  for (const [sender, name] of Object.entries(NEWSLETTERS)) {
    if (email.includes(sender.split('@')[0])) {
      return name;
    }
  }

  return null; // Unknown sender
}

/**
 * Call Claude Haiku to extract news items from email
 */
async function extractWithClaude(emailContent, subject, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      system: `You extract AI news items from newsletter emails. Output valid JSON only.

For each distinct news item in the newsletter, extract:
- headline: The news headline (concise, factual)
- summary: One-sentence summary of the news
- source_url: The primary source URL if mentioned (not the newsletter link)
- entities: Array of key entities (companies, products, people) mentioned

Rules:
- Only extract AI-related news items
- Skip promotional content, ads, job listings
- Skip newsletter meta-content (subscribe links, about sections)
- If no source URL is found, use null
- Maximum 10 items per newsletter
- Output must be valid JSON array`,
      messages: [
        {
          role: 'user',
          content: `Extract AI news items from this newsletter.

Subject: ${subject}

Content:
${emailContent}

Output a JSON array of news items. Example format:
[
  {
    "headline": "OpenAI releases GPT-5",
    "summary": "OpenAI announced GPT-5 with improved reasoning capabilities.",
    "source_url": "https://openai.com/blog/gpt-5",
    "entities": ["OpenAI", "GPT-5"]
  }
]

Return ONLY the JSON array, no other text.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0].text;

  // Parse JSON from response
  try {
    // Handle potential markdown code blocks
    const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Failed to parse Claude response:', content);
    return [];
  }
}

/**
 * Store items in Supabase
 */
async function storeItems(items, newsletterName, subject, rawContent, env) {
  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY;

  const records = items.map((item) => ({
    newsletter_name: newsletterName,
    email_received_at: new Date().toISOString(),
    email_subject: subject,
    headline: item.headline,
    summary: item.summary,
    source_url: item.source_url,
    entities: item.entities || [],
    raw_content: rawContent.slice(0, 50000), // Limit size
  }));

  const response = await fetch(`${supabaseUrl}/rest/v1/newsletter_items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(records),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase error: ${response.status} - ${error}`);
  }

  return records.length;
}

/**
 * Convert email stream to text
 */
async function streamToText(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  return result;
}

/**
 * Main email handler
 */
export default {
  async email(message, env, ctx) {
    const from = message.from;
    const subject = message.headers.get('subject') || 'No subject';

    console.log(`Received email from: ${from}`);
    console.log(`Subject: ${subject}`);

    // Identify newsletter
    const newsletterName = identifyNewsletter(from);

    if (!newsletterName) {
      console.log(`Unknown sender, ignoring: ${from}`);
      return; // Silently ignore unknown senders
    }

    console.log(`Identified newsletter: ${newsletterName}`);

    try {
      // Get email content
      const rawEmail = await streamToText(message.raw);

      // Extract news items with Claude
      console.log('Extracting news items with Claude...');
      const items = await extractWithClaude(rawEmail, subject, env.ANTHROPIC_API_KEY);

      console.log(`Extracted ${items.length} items`);

      if (items.length === 0) {
        console.log('No items extracted, skipping storage');
        return;
      }

      // Store in Supabase
      console.log('Storing items in Supabase...');
      const stored = await storeItems(items, newsletterName, subject, rawEmail, env);

      console.log(`Successfully stored ${stored} items from ${newsletterName}`);
    } catch (error) {
      console.error(`Error processing newsletter: ${error.message}`);
      // Don't throw - we don't want to bounce the email
    }
  },
};
```

**Step 5: Commit**

```bash
git add cloudflare-worker/
git commit -m "feat: add Cloudflare Email Worker for newsletter ingestion"
```

---

## Task 3: Configure Cloudflare Email Routing (Manual)

**This task requires manual steps in Cloudflare Dashboard.**

**Step 1: Enable Email Routing for vdr.me**

1. Log in to Cloudflare Dashboard
2. Select the `vdr.me` domain
3. Go to **Email** > **Email Routing**
4. Click **Enable Email Routing** if not already enabled
5. Add required DNS records when prompted

**Step 2: Create Email Worker route**

1. Go to **Email** > **Email Routing** > **Email Workers**
2. Click **Create**
3. Select the `newsletter-ingest` worker
4. Set the route: `ainews@vdr.me`

**Step 3: Set Worker secrets**

```bash
cd cloudflare-worker/newsletter-ingest
wrangler secret put ANTHROPIC_API_KEY
# Enter your Anthropic API key when prompted

wrangler secret put SUPABASE_URL
# Enter: https://azzzrjnqgkqwpqnroost.supabase.co

wrangler secret put SUPABASE_SERVICE_KEY
# Enter your Supabase service role key (from Supabase Dashboard > Settings > API)
```

**Step 4: Deploy the Worker**

```bash
cd cloudflare-worker/newsletter-ingest
npm install
wrangler deploy
```

**Step 5: Verify deployment**

Check the Cloudflare Dashboard > Workers & Pages to confirm the worker is deployed and the email trigger is active.

---

## Task 4: Update build-scan.js for Newsletter Aggregation

**Files:**
- Modify: `ai-daily-intel/build-scan.js`

**Step 1: Add newsletter fetching function after line 129**

Add this function after `fetchNewsAPI`:

```javascript
/**
 * Fetch unprocessed newsletter items from Supabase
 */
async function fetchNewsletterItems() {
  console.log('  Fetching newsletter items from Supabase...');

  const { data, error } = await supabase
    .from('newsletter_items')
    .select('*')
    .is('processed_at', null)
    .order('email_received_at', { ascending: false });

  if (error) {
    console.error(`    Error fetching newsletter items: ${error.message}`);
    return [];
  }

  console.log(`    Found ${data.length} unprocessed newsletter items`);
  return data;
}

/**
 * Cluster newsletter items by similarity and count hits
 */
function clusterNewsletterItems(items) {
  const clusters = [];

  for (const item of items) {
    let foundCluster = false;

    for (const cluster of clusters) {
      // Check headline similarity
      if (titleSimilarity(item.headline, cluster.headline) >= 0.6) {
        cluster.hits.push({
          newsletter: item.newsletter_name,
          headline: item.headline,
          summary: item.summary,
          source_url: item.source_url,
          entities: item.entities,
          id: item.id,
        });
        // Update cluster entities
        if (item.entities) {
          cluster.entities = [...new Set([...cluster.entities, ...item.entities])];
        }
        foundCluster = true;
        break;
      }

      // Check entity overlap
      if (item.entities && cluster.entities) {
        const overlap = item.entities.filter(e =>
          cluster.entities.some(ce => ce.toLowerCase() === e.toLowerCase())
        );
        if (overlap.length >= 2) {
          cluster.hits.push({
            newsletter: item.newsletter_name,
            headline: item.headline,
            summary: item.summary,
            source_url: item.source_url,
            entities: item.entities,
            id: item.id,
          });
          cluster.entities = [...new Set([...cluster.entities, ...item.entities])];
          foundCluster = true;
          break;
        }
      }
    }

    if (!foundCluster) {
      clusters.push({
        headline: item.headline,
        summary: item.summary,
        source_url: item.source_url,
        entities: item.entities || [],
        hits: [{
          newsletter: item.newsletter_name,
          headline: item.headline,
          summary: item.summary,
          source_url: item.source_url,
          entities: item.entities,
          id: item.id,
        }],
      });
    }
  }

  // Sort by hit count (descending)
  clusters.sort((a, b) => b.hits.length - a.hits.length);

  return clusters;
}

/**
 * Match clusters to RSS items for primary sources
 */
function matchClustersToRSS(clusters, rssItems) {
  for (const cluster of clusters) {
    for (const rss of rssItems) {
      // Check title similarity
      if (titleSimilarity(cluster.headline, rss.title) >= 0.5) {
        cluster.primarySource = {
          title: rss.title,
          url: rss.url,
          publisher: rss.publisher,
        };
        break;
      }

      // Check entity match in RSS content
      if (cluster.entities && rss.content) {
        const matches = cluster.entities.filter(e =>
          rss.content.toLowerCase().includes(e.toLowerCase())
        );
        if (matches.length >= 2) {
          cluster.primarySource = {
            title: rss.title,
            url: rss.url,
            publisher: rss.publisher,
          };
          break;
        }
      }
    }
  }

  return clusters;
}

/**
 * Mark newsletter items as processed
 */
async function markItemsProcessed(clusters, slug) {
  const itemIds = clusters.flatMap(c => c.hits.map(h => h.id));

  if (itemIds.length === 0) return;

  const { error } = await supabase
    .from('newsletter_items')
    .update({
      processed_at: new Date().toISOString(),
      dains_slug: slug,
    })
    .in('id', itemIds);

  if (error) {
    console.error(`Error marking items processed: ${error.message}`);
  } else {
    console.log(`Marked ${itemIds.length} newsletter items as processed`);
  }
}
```

**Step 2: Update the main function to integrate newsletter items**

Replace the `main()` function (lines 314-396) with:

```javascript
/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Daily AI Intel - Build');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load sources
  const sources = loadSources();
  const enabledRSS = sources.rss.filter(s => s.enabled);
  const enabledAPI = sources.api.filter(s => s.enabled);

  console.log(`\nLoaded ${enabledRSS.length} RSS sources, ${enabledAPI.length} API sources`);

  // Check if today's scan already exists (for DST dual-schedule)
  const today = new Date();
  const todaySlug = `daily-ai-intel-${today.toISOString().split('T')[0]}`;

  const { data: existingToday } = await supabase
    .from('published_posts')
    .select('id')
    .eq('slug', todaySlug)
    .single();

  if (existingToday && !DRY_RUN) {
    console.log(`\n✅ Scan for today (${todaySlug}) already exists. Skipping.`);
    console.log('This is expected when both DST schedules fire.\n');
    process.exit(0);
  }

  // Fetch newsletter items first (they determine ranking)
  console.log('\n--- Fetching Newsletter Items ---');
  const newsletterItems = await fetchNewsletterItems();

  // Cluster newsletter items
  console.log('\n--- Clustering Newsletter Items ---');
  const clusters = clusterNewsletterItems(newsletterItems);
  console.log(`Formed ${clusters.length} clusters from newsletter items`);

  // Log top clusters
  clusters.slice(0, 5).forEach((c, i) => {
    console.log(`  #${i + 1}: "${c.headline.slice(0, 50)}..." (${c.hits.length} hits)`);
  });

  // Fetch RSS feeds
  console.log('\n--- Fetching RSS feeds ---');
  const rssResults = await Promise.all(enabledRSS.map(fetchRSSFeed));
  const rssItems = rssResults.flat();

  console.log('\n--- Fetching API sources ---');
  const apiResults = await Promise.all(enabledAPI.map(fetchNewsAPI));
  const apiItems = apiResults.flat();

  const allRSSItems = [...rssItems, ...apiItems];
  console.log(`\nTotal RSS items fetched: ${allRSSItems.length}`);

  // Deduplicate RSS items
  console.log('\n--- Deduplicating RSS ---');
  const deduplicatedRSS = deduplicateItems(allRSSItems);
  console.log(`After deduplication: ${deduplicatedRSS.length} unique RSS items`);

  // Match clusters to RSS for primary sources
  console.log('\n--- Matching clusters to RSS sources ---');
  const matchedClusters = matchClustersToRSS(clusters, deduplicatedRSS);
  const withPrimary = matchedClusters.filter(c => c.primarySource).length;
  console.log(`${withPrimary}/${matchedClusters.length} clusters matched to primary sources`);

  // Determine final story count
  const MIN_STORIES = 5;
  const TARGET_STORIES = 10;

  // If we have newsletter clusters, use those for ranking
  // Otherwise fall back to RSS-only
  let topStories;
  let isNewsletterRanked = false;

  if (clusters.length >= MIN_STORIES) {
    topStories = clusters.slice(0, TARGET_STORIES);
    isNewsletterRanked = true;
    console.log(`\nUsing newsletter-ranked stories: ${topStories.length}`);
  } else {
    // Fallback to RSS-only if not enough newsletter items
    console.log(`\nNot enough newsletter clusters (${clusters.length}), falling back to RSS`);
    topStories = deduplicatedRSS.slice(0, TARGET_STORIES).map(rss => ({
      headline: rss.title,
      summary: rss.snippet,
      primarySource: { title: rss.title, url: rss.url, publisher: rss.publisher },
      hits: [],
      entities: [],
    }));
  }

  // Check minimum threshold
  if (topStories.length < MIN_STORIES) {
    console.error(`\nERROR: Only ${topStories.length} stories found, minimum is ${MIN_STORIES}`);
    console.error('Aborting to avoid publishing low-quality scan.');
    process.exit(1);
  }

  // Synthesize
  console.log(`\nSending ${topStories.length} stories to Claude for synthesis`);
  const briefing = await synthesizeBriefing(topStories, isNewsletterRanked);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(briefing.html);
    console.log('\n--- END DRY RUN ---');
    return;
  }

  // Publish
  const slug = await publishToSupabase(briefing);

  // Mark newsletter items as processed
  if (isNewsletterRanked) {
    await markItemsProcessed(clusters.slice(0, TARGET_STORIES), slug);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUCCESS!');
  console.log(`Published: https://victordelrosal.com/${slug}/`);
  console.log('='.repeat(60));
}
```

**Step 3: Update synthesizeBriefing function**

Replace `synthesizeBriefing` function (lines 217-258) with:

```javascript
/**
 * Synthesize briefing with Claude
 */
async function synthesizeBriefing(stories, isNewsletterRanked) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { SYSTEM_PROMPT, getUserPrompt, formatStoriesForPrompt } = await import('./prompts.js');

  const formattedStories = formatStoriesForPrompt(stories, isNewsletterRanked);
  const userPrompt = getUserPrompt(dateString, formattedDate, formattedStories, isNewsletterRanked);

  console.log('\nCalling Claude for synthesis...');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Insert header image AFTER the <h1> tag
  const headerImageHtml = `<img src="${HEADER_IMAGE_URL}" alt="Daily AI Intel" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 2rem; border-radius: 8px;">`;
  const htmlWithImage = content.text.replace(/<\/h1>/i, `</h1>\n${headerImageHtml}\n`);

  return {
    html: htmlWithImage,
    dateString,
    formattedDate,
  };
}
```

**Step 4: Update publishToSupabase to use new slug format**

Update the slug generation in `publishToSupabase` (line 264):

```javascript
const slug = `daily-ai-intel-${briefing.dateString}`;
```

**Step 5: Commit**

```bash
git add ai-daily-intel/build-scan.js
git commit -m "feat: integrate newsletter aggregation into build-scan"
```

---

## Task 5: Update prompts.js for Tiered Output

**Files:**
- Modify: `ai-daily-intel/prompts.js`

**Step 1: Replace entire prompts.js content**

```javascript
/**
 * Claude prompts for Daily AI Intel
 */

export const SYSTEM_PROMPT = `You are an automated AI news aggregator producing a daily intelligence briefing for victordelrosal.com.

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
    ? 'Stories are ranked by newsletter coverage (hit count). Higher hits = more important.'
    : 'Stories are from RSS feeds only (newsletter data unavailable).';

  return `Today's date: ${date}

${rankingNote}

Here are today's top AI stories:

${formattedStories}

Write a briefing with this EXACT structure in clean HTML:

<h1>Daily AI Intel — ${formattedDate}</h1>

<h2>Executive Summary</h2>
<p>70-100 words. Lead with the #1 story, mention #2 and #3. Set context for today's news.</p>

<h2>Top Stories</h2>

<!-- Stories #1-3: Full treatment -->
<div class="story story-top">
<h3>1. [Headline] <span class="hits">([X] sources)</span></h3>
<p>Full paragraph (3-4 sentences) with details, context, and implications.</p>
<p class="attribution"><strong>Source:</strong> <a href="[URL]">[Publisher]</a><br>
<em>Via: [Newsletter1], [Newsletter2], [Newsletter3] +[N] more</em></p>
</div>

<!-- Repeat for #2 and #3 -->

<h2>Notable</h2>

<!-- Stories #4-7: One-liner + subtitle -->
<p><strong>4. [Headline]</strong> — [One-sentence summary]. <em>([X] sources)</em></p>
<p><strong>5. [Headline]</strong> — [One-sentence summary]. <em>([X] sources)</em></p>
<p><strong>6. [Headline]</strong> — [One-sentence summary]. <em>([X] sources)</em></p>
<p><strong>7. [Headline]</strong> — [One-sentence summary]. <em>([X] sources)</em></p>

<h2>Also Noted</h2>

<!-- Stories #8-10: One-liners only -->
<p>8. [Headline] ([X]) · 9. [Headline] ([X]) · 10. [Headline] ([X])</p>

<hr>
<p><em>Compiled from 14 newsletters + 24 RSS sources at 07:00 GMT. <a href="/daily-ai-news-scan-about/">How this works</a></em></p>

Important:
- Output ONLY valid HTML, no markdown
- If fewer than 10 stories, adjust sections (min 5 stories)
- The "Via" line shows which newsletters covered the story
- Source link should be primary source when available
- Hit count in parentheses shows newsletter coverage`;
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
```

**Step 2: Commit**

```bash
git add ai-daily-intel/prompts.js
git commit -m "feat: update prompts for tiered newsletter-ranked output"
```

---

## Task 6: Test the Complete Flow

**Step 1: Run dry-run test**

```bash
cd ai-daily-intel
SUPABASE_URL='https://azzzrjnqgkqwpqnroost.supabase.co' \
SUPABASE_ANON_KEY='[your-anon-key]' \
ANTHROPIC_API_KEY='[your-key]' \
node build-scan.js --dry-run
```

Expected: Should show newsletter fetching, clustering, and tiered output format.

**Step 2: Test email worker locally (optional)**

```bash
cd cloudflare-worker/newsletter-ingest
wrangler dev
```

Then send a test email to verify parsing.

**Step 3: Sign up ainews@vdr.me to newsletters**

Manually subscribe `ainews@vdr.me` to all 14 newsletters:
1. AI Fire
2. The Neuron
3. The Rundown AI
4. Rohan's Bytes
5. Techpresso
6. 1440 Daily Digest
7. IBM Think Newsletter
8. AI for Good
9. State of AI
10. The Pragmatic Engineer
11. Exponential View
12. David Shapiro
13. Future Blueprint
14. Superhuman AI

**Step 4: Verify first newsletter arrives**

Check Supabase `newsletter_items` table after first newsletter arrives:

```sql
SELECT * FROM newsletter_items ORDER BY created_at DESC LIMIT 10;
```

**Step 5: Commit all changes and push**

```bash
git add -A
git commit -m "feat: complete newsletter aggregation system for DAINS"
git push
```

---

## Task 7: Update GitHub Actions Workflow (Optional)

**Files:**
- Modify: `.github/workflows/daily-ai-news-scan.yml`

If you want to update the workflow name and slug:

**Step 1: Update workflow file**

Change the slug reference from `daily-ai-news-scan` to `daily-ai-intel` if desired.

**Step 2: Commit**

```bash
git add .github/workflows/
git commit -m "chore: update workflow for daily-ai-intel naming"
git push
```

---

## Summary

After completing all tasks:

1. **newsletters.json** - Registry of 14 newsletter senders
2. **Cloudflare Worker** - Parses incoming emails, stores to Supabase
3. **Email routing** - ainews@vdr.me → Worker
4. **build-scan.js** - Fetches newsletters + RSS, clusters, ranks, synthesizes
5. **prompts.js** - Tiered output format (Top 3 full, #4-7 one-liner+subtitle, #8-10 one-liner)

The system will:
- Receive newsletters throughout the day
- Parse and store items in real-time
- At 07:00 UTC, aggregate all items since last run
- Rank by hit count (newsletter consensus)
- Match to RSS primary sources
- Publish tiered Top 10 briefing
