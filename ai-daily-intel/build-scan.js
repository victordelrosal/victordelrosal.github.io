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

import { SYSTEM_PROMPT, getUserPrompt, formatItemsForPrompt } from './prompts.js';

// Get directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
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
async function synthesizeBriefing(items) {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0];
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const aggregatedItems = formatItemsForPrompt(items);
  const userPrompt = getUserPrompt(dateString, formattedDate, aggregatedItems);

  console.log('\nCalling Claude for synthesis...');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Insert header image AFTER the <h1> tag (not before, because wave-loader.js strips the first element)
  const headerImageHtml = `<img src="${HEADER_IMAGE_URL}" alt="Daily AI News Scan" style="width: 100%; max-width: 800px; height: auto; margin-bottom: 2rem; border-radius: 8px;">`;
  const htmlWithImage = content.text.replace(/<\/h1>/i, `</h1>\n${headerImageHtml}\n`);

  return {
    html: htmlWithImage,
    dateString,
    formattedDate,
  };
}

/**
 * Publish to Supabase
 */
async function publishToSupabase(briefing) {
  const slug = `daily-ai-news-scan-${briefing.dateString}`;
  const title = `Daily AI News Scan — ${briefing.formattedDate}`;
  // Generate a note_id in the same format as Flux (YYYYMMDDHHMMSS.md)
  // Using 'ai-news-scan-' prefix to distinguish from Flux notes
  const noteId = `ai-news-scan-${briefing.dateString.replace(/-/g, '')}050000.md`;

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
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load sources
  const sources = loadSources();
  const enabledRSS = sources.rss.filter(s => s.enabled);
  const enabledAPI = sources.api.filter(s => s.enabled);

  console.log(`\nLoaded ${enabledRSS.length} RSS sources, ${enabledAPI.length} API sources`);

  // Fetch all items
  console.log('\n--- Fetching RSS feeds ---');
  const rssResults = await Promise.all(enabledRSS.map(fetchRSSFeed));
  const rssItems = rssResults.flat();

  console.log('\n--- Fetching API sources ---');
  const apiResults = await Promise.all(enabledAPI.map(fetchNewsAPI));
  const apiItems = apiResults.flat();

  const allItems = [...rssItems, ...apiItems];
  console.log(`\nTotal items fetched: ${allItems.length}`);

  // Deduplicate
  console.log('\n--- Deduplicating ---');
  const deduplicated = deduplicateItems(allItems);
  console.log(`After deduplication: ${deduplicated.length} unique items`);

  // Check minimum threshold
  if (deduplicated.length < MIN_ITEMS_REQUIRED) {
    console.error(`\nERROR: Only ${deduplicated.length} items found, minimum is ${MIN_ITEMS_REQUIRED}`);
    console.error('Aborting to avoid publishing low-quality scan.');
    process.exit(1);
  }

  // Take top items for synthesis (limit to avoid token overflow)
  const topItems = deduplicated.slice(0, 15);
  console.log(`\nSending ${topItems.length} items to Claude for synthesis`);

  // Synthesize
  const briefing = await synthesizeBriefing(topItems);

  if (DRY_RUN) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(briefing.html);
    console.log('\n--- END DRY RUN ---');
    return;
  }

  // Publish
  const slug = await publishToSupabase(briefing);

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
