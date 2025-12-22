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
