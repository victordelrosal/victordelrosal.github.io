#!/usr/bin/env node
/**
 * Daily AI News Scan - Build Script
 *
 * Fetches AI news from RSS feeds, deduplicates, synthesizes with Claude,
 * and publishes to Supabase as a wave.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { SYSTEM_PROMPT, getUserPrompt, formatItemsForPrompt, formatStoriesForPrompt } from './prompts.js';

// Get directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_REGENERATE = process.argv.includes('--force');
const HOURS_LOOKBACK = 24;
const MAX_ITEMS_PER_SOURCE = 10;
const MIN_ITEMS_REQUIRED = 3;
const FUZZY_MATCH_THRESHOLD = 0.8;
const HEADER_IMAGE_URL = 'https://victordelrosal.com/img/daily-ai-news-scan.png';

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'DailyAIIntelScan/1.0 (victordelrosal.com)',
  },
});

/**
 * Load sources from sources.json
 */
function loadSources() {
  const sourcesPath = join(__dirname, 'sources.json');
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf-8'));
  return sources;
}

/**
 * Fetch items from an RSS feed
 */
async function fetchRSSFeed(source) {
  try {
    console.log(`  Fetching: ${source.name}`);
    const feed = await rssParser.parseURL(source.url);

    const cutoffTime = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000);
    const maxItems = source.maxItems || MAX_ITEMS_PER_SOURCE;

    const items = feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate || item.isoDate);
        return pubDate >= cutoffTime;
      })
      .slice(0, maxItems)
      .map(item => normalizeItem(item, source));

    console.log(`    Found ${items.length} items from last ${HOURS_LOOKBACK}h`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

/**
 * Fetch items from NewsAPI (if enabled and API key available)
 */
async function fetchNewsAPI(source) {
  if (!process.env.NEWS_API_KEY) {
    console.log(`  Skipping ${source.name}: NEWS_API_KEY not configured`);
    return [];
  }

  try {
    console.log(`  Fetching: ${source.name}`);
    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', source.query);
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '10');
    url.searchParams.set('apiKey', process.env.NEWS_API_KEY);

    // Set date range to last 24 hours
    const fromDate = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000);
    url.searchParams.set('from', fromDate.toISOString());

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'ok') {
      throw new Error(data.message || 'NewsAPI error');
    }

    const items = (data.articles || []).map(article => ({
      title: article.title,
      publisher: article.source?.name || 'Unknown',
      url: cleanUrl(article.url),
      publishedAt: article.publishedAt,
      snippet: article.description,
      content: article.content || article.description,
      sourcePriority: source.priority,
      sourceId: source.id,
    }));

    console.log(`    Found ${items.length} items`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

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

/**
 * Normalize an RSS item to our unified schema
 */
function normalizeItem(item, source) {
  return {
    title: item.title || 'Untitled',
    publisher: source.name,
    url: cleanUrl(item.link || item.guid),
    publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
    snippet: item.contentSnippet || item.summary || '',
    content: item.content || item.contentSnippet || item.summary || '',
    sourcePriority: source.priority,
    sourceId: source.id,
  };
}

/**
 * Clean URL by removing tracking parameters
 */
function cleanUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Calculate similarity between two titles (simple word overlap)
 */
function titleSimilarity(title1, title2) {
  const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const words1 = new Set(normalize(title1));
  const words2 = new Set(normalize(title2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

/**
 * Deduplicate items by URL and fuzzy title matching
 */
function deduplicateItems(items) {
  // Sort by priority (lower = better)
  const sorted = [...items].sort((a, b) => a.sourcePriority - b.sourcePriority);

  const seen = new Map(); // url -> item
  const seenTitles = []; // {title, item}
  const deduplicated = [];

  for (const item of sorted) {
    // Check exact URL match
    if (seen.has(item.url)) {
      console.log(`  Dedup (URL): "${item.title.slice(0, 50)}..."`);
      continue;
    }

    // Check fuzzy title match
    let isDuplicate = false;
    for (const {title, item: existingItem} of seenTitles) {
      if (titleSimilarity(item.title, title) >= FUZZY_MATCH_THRESHOLD) {
        console.log(`  Dedup (title): "${item.title.slice(0, 50)}..." matches "${title.slice(0, 50)}..."`);
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      seen.set(item.url, item);
      seenTitles.push({title: item.title, item});
      deduplicated.push(item);
    }
  }

  return deduplicated;
}

/**
 * Synthesize briefing with Claude
 */
async function synthesizeBriefing(stories, isNewsletterRanked) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  // Use explicit UTC timezone to ensure consistent day-of-week calculation
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });

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
  const headerImageHtml = `<img src="${HEADER_IMAGE_URL}" alt="Daily AI News Scan" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 2rem; border-radius: 8px;">`;
  const htmlWithImage = content.text.replace(/<\/h1>/i, `</h1>\n${headerImageHtml}\n`);

  return {
    html: htmlWithImage,
    dateString,
    formattedDate,
  };
}

/**
 * Extract headline from HTML content (the h1 tag)
 */
function extractHeadline(html) {
  const match = html.match(/<h1>(.*?)<\/h1>/i);
  return match ? match[1].trim() : null;
}

/**
 * Publish to Supabase
 */
async function publishToSupabase(briefing) {
  const slug = `daily-ai-news-scan-${briefing.dateString}`;
  // Use the top story headline as the title (extracted from h1), fallback to generic
  const headline = extractHeadline(briefing.html);
  const title = headline || `Daily AI News Scan — ${briefing.formattedDate}`;
  // Generate a note_id in the same format as Flux (YYYYMMDDHHMMSS.md)
  // Using 'ai-intel-' prefix to distinguish from Flux notes
  const noteId = `ai-intel-${briefing.dateString.replace(/-/g, '')}070000.md`;

  console.log(`\nPublishing to Supabase: ${slug}`);

  // Check if already exists
  const { data: existing } = await supabase
    .from('published_posts')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) {
    console.log('  Scan already exists for today, updating...');
    const { error } = await supabase
      .from('published_posts')
      .update({
        title,
        content: briefing.html,
        image: HEADER_IMAGE_URL,
        published_at: new Date().toISOString(),
      })
      .eq('slug', slug);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('published_posts')
      .insert({
        note_id: noteId,
        slug,
        title,
        content: briefing.html,
        image: HEADER_IMAGE_URL,
        published_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  console.log('  Published successfully!');
  return slug;
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(60));
  console.log('Daily AI News Scan - Build');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : FORCE_REGENERATE ? 'FORCE REGENERATE' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load sources
  const sources = loadSources();
  const enabledRSS = sources.rss.filter(s => s.enabled);
  const enabledAPI = sources.api.filter(s => s.enabled);

  console.log(`\nLoaded ${enabledRSS.length} RSS sources, ${enabledAPI.length} API sources`);

  // Check if today's scan already exists (for DST dual-schedule)
  const today = new Date();
  const todaySlug = `daily-ai-news-scan-${today.toISOString().split('T')[0]}`;

  const { data: existingToday } = await supabase
    .from('published_posts')
    .select('id')
    .eq('slug', todaySlug)
    .single();

  if (existingToday && !DRY_RUN && !FORCE_REGENERATE) {
    console.log(`\n✅ Scan for today (${todaySlug}) already exists. Skipping.`);
    console.log('This is expected when both DST schedules fire.');
    console.log('Use --force to regenerate.\n');
    process.exit(0);
  }

  if (FORCE_REGENERATE && existingToday) {
    console.log(`\n🔄 Force regenerating today's scan (${todaySlug})...`);
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

// Run
main().catch(error => {
  console.error('\nFATAL ERROR:', error.message);
  console.error(error.stack);
  process.exit(1);
});
