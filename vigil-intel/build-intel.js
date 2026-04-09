#!/usr/bin/env node
/**
 * VDISIP Phase 1: Daily AI Frontier Intelligence Scanner
 *
 * Forked from DAINS (ai-daily-intel/build-scan.js).
 * Scans stack-focused sources for actionable improvements to
 * Claude Code, VIGIL, and TeamVictor workflows.
 *
 * Output: JSON to Supabase vigil_intel table + local file.
 */

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import { SYSTEM_PROMPT, getUserPrompt, formatItemForPrompt } from './prompts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Configuration ──────────────────────────────────────────────
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE_REGENERATE = process.argv.includes('--force');
const DATE_OVERRIDE = process.argv.find(a => a.startsWith('--date='))?.split('=')[1] || null;
const HOURS_LOOKBACK = 24;
const MAX_ITEMS_PER_SOURCE = 15;
const FUZZY_MATCH_THRESHOLD = 0.8;

// Local output directory (Dropbox)
const LOCAL_OUTPUT_DIR = join(
  process.env.HOME || '/root',
  'Dropbox/Dropbox24/fiveinnolabs/SmallBets/vigil/daily-intel/raw'
);

// ── Clients (lazy init for dry-run support) ────────────────────
let supabase = null;
let anthropic = null;

function getSupabase() {
  if (!supabase) {
    if (!process.env.SUPABASE_URL) throw new Error('SUPABASE_URL is required');
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
    );
  }
  return supabase;
}

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'VIGIL-Intel/1.0 (vdr.me)',
  },
});

// ── Shared utilities (from DAINS, verbatim) ────────────────────

function cleanUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

function titleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;
  const normalize = (t) => t.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
  const words1 = new Set(normalize(title1));
  const words2 = new Set(normalize(title2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

function deduplicateItems(items) {
  const sorted = [...items].sort((a, b) => (a.sourcePriority || 5) - (b.sourcePriority || 5));
  const seen = new Map();
  const seenTitles = [];
  const deduplicated = [];

  for (const item of sorted) {
    if (item.url && seen.has(item.url)) {
      console.log(`  Dedup (URL): "${(item.title || '').slice(0, 50)}..."`);
      continue;
    }

    let isDuplicate = false;
    for (const { title } of seenTitles) {
      if (titleSimilarity(item.title, title) >= FUZZY_MATCH_THRESHOLD) {
        console.log(`  Dedup (title): "${(item.title || '').slice(0, 50)}..."`);
        isDuplicate = true;
        break;
      }
    }

    if (!isDuplicate) {
      if (item.url) seen.set(item.url, item);
      seenTitles.push({ title: item.title, item });
      deduplicated.push(item);
    }
  }

  return deduplicated;
}

// ── RSS Fetcher (from DAINS, adapted) ──────────────────────────

async function fetchRSSFeed(source) {
  try {
    console.log(`  Fetching RSS: ${source.name}`);
    const feed = await rssParser.parseURL(source.url);

    const cutoffTime = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000);
    const maxItems = source.maxItems || MAX_ITEMS_PER_SOURCE;

    const items = feed.items
      .filter(item => {
        const pubDate = new Date(item.pubDate || item.isoDate);
        return pubDate >= cutoffTime;
      })
      .slice(0, maxItems)
      .map(item => ({
        title: item.title || 'Untitled',
        source: source.name,
        url: cleanUrl(item.link || item.guid),
        date: item.pubDate || item.isoDate || new Date().toISOString(),
        content: item.contentSnippet || item.summary || item.content || '',
        sourcePriority: source.priority,
        sourceId: source.id,
      }));

    console.log(`    Found ${items.length} items from last ${HOURS_LOOKBACK}h`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

// ── Reddit JSON Fetcher ────────────────────────────────────────

async function fetchReddit(source) {
  try {
    console.log(`  Fetching Reddit: ${source.name}`);
    const url = `https://www.reddit.com/r/${source.subreddit}/hot.json?limit=${source.limit || 25}&raw_json=1`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VIGIL-Intel/1.0 (by /u/vigilbot)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const cutoffTime = Date.now() / 1000 - (HOURS_LOOKBACK * 60 * 60);

    const items = (data.data?.children || [])
      .filter(post => {
        const p = post.data;
        return p.created_utc >= cutoffTime && !p.stickied && !p.over_18;
      })
      .map(post => {
        const p = post.data;
        return {
          title: p.title,
          source: source.name,
          url: p.url_overridden_by_dest || `https://www.reddit.com${p.permalink}`,
          date: new Date(p.created_utc * 1000).toISOString(),
          content: (p.selftext || '').slice(0, 500),
          sourcePriority: source.priority,
          sourceId: source.id,
          score: p.score,
          numComments: p.num_comments,
        };
      })
      .filter(item => (item.score || 0) >= 5); // Minimum upvote threshold

    console.log(`    Found ${items.length} items (score >= 5, last ${HOURS_LOOKBACK}h)`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

// ── Hacker News Algolia Fetcher ────────────────────────────────

async function fetchHackerNews(source) {
  try {
    console.log(`  Fetching HN: ${source.name}`);
    const cutoffTimestamp = Math.floor(Date.now() / 1000) - (HOURS_LOOKBACK * 60 * 60);
    const query = encodeURIComponent(source.query);
    const url = `https://hn.algolia.com/api/v1/search_by_date?query=${query}&tags=story&numericFilters=created_at_i>${cutoffTimestamp}&hitsPerPage=15`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const items = (data.hits || []).map(hit => ({
      title: hit.title,
      source: source.name,
      url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
      date: hit.created_at,
      content: hit.story_text || '',
      sourcePriority: source.priority,
      sourceId: source.id,
      score: hit.points,
      numComments: hit.num_comments,
    }));

    console.log(`    Found ${items.length} items from last ${HOURS_LOOKBACK}h`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

// ── GitHub Releases Fetcher ────────────────────────────────────

async function fetchGitHubReleases(source) {
  try {
    console.log(`  Fetching GitHub releases: ${source.name}`);
    const url = `https://api.github.com/repos/${source.repo}/releases?per_page=5`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VIGIL-Intel/1.0',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const releases = await response.json();
    const cutoffTime = new Date(Date.now() - HOURS_LOOKBACK * 60 * 60 * 1000);

    const items = releases
      .filter(r => new Date(r.published_at) >= cutoffTime)
      .map(r => ({
        title: `${source.repo} ${r.tag_name}: ${r.name || 'New Release'}`,
        source: source.name,
        url: r.html_url,
        date: r.published_at,
        content: (r.body || '').slice(0, 1000),
        sourcePriority: source.priority,
        sourceId: source.id,
      }));

    console.log(`    Found ${items.length} releases from last ${HOURS_LOOKBACK}h`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

// ── GitHub Trending Fetcher ────────────────────────────────────

async function fetchGitHubTrending(source) {
  try {
    console.log(`  Fetching GitHub trending: ${source.name}`);
    // Use GitHub search API for recently created repos with AI/LLM topics
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const url = `https://api.github.com/search/repositories?q=topic:llm+topic:ai+created:>${cutoffDate}&sort=stars&order=desc&per_page=10`;

    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'VIGIL-Intel/1.0',
    };
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    const items = (data.items || [])
      .filter(repo => repo.stargazers_count >= 50) // Minimum star threshold
      .slice(0, 10)
      .map(repo => ({
        title: `${repo.full_name}: ${repo.description || 'No description'}`,
        source: source.name,
        url: repo.html_url,
        date: repo.created_at,
        content: `Stars: ${repo.stargazers_count}. Language: ${repo.language || 'unknown'}. ${repo.description || ''}`,
        sourcePriority: source.priority,
        sourceId: source.id,
      }));

    console.log(`    Found ${items.length} trending repos (50+ stars)`);
    return items;
  } catch (error) {
    console.error(`    Error fetching ${source.name}: ${error.message}`);
    return [];
  }
}

// ── DAINS Cross-reference ──────────────────────────────────────

async function fetchDAINSContext() {
  try {
    console.log('  Fetching DAINS context...');
    const targetDate = DATE_OVERRIDE || new Date().toISOString().split('T')[0];
    const slug = `daily-ai-news-scan-${targetDate}`;

    const { data, error } = await getSupabase()
      .from('published_posts')
      .select('title, content')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      console.log('    No DAINS scan found for today');
      return null;
    }

    // Extract just headlines from DAINS HTML (strip tags, get key text)
    const headlines = (data.content || '')
      .match(/<h3>.*?<\/h3>/gi)
      ?.map(h => h.replace(/<[^>]+>/g, '').trim())
      .join('\n') || '';

    console.log(`    Found DAINS context: "${(data.title || '').slice(0, 50)}..."`);
    return `DAINS Title: ${data.title}\nTop headlines:\n${headlines}`;
  } catch (error) {
    console.error(`    Error fetching DAINS: ${error.message}`);
    return null;
  }
}

// ── Synthesis with Claude ──────────────────────────────────────

async function synthesizeIntel(items, dainsContext, dateString) {
  const formattedItems = items.map((item, i) => formatItemForPrompt(item, i)).join('\n');
  const userPrompt = getUserPrompt(formattedItems, dainsContext, dateString);

  console.log('\nCalling Claude for intel synthesis...');
  console.log(`  Items to evaluate: ${items.length}`);

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  if (response.stop_reason === 'max_tokens') {
    console.error('\n  WARNING: Claude hit max_tokens limit. Output may be truncated.');
  }

  // Parse JSON response
  let intel;
  try {
    // Strip any markdown code fences Claude might add
    const jsonText = content.text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    intel = JSON.parse(jsonText);
  } catch (parseError) {
    console.error('  Failed to parse Claude response as JSON:');
    console.error('  Response preview:', content.text.slice(0, 200));
    throw new Error(`JSON parse error: ${parseError.message}`);
  }

  console.log(`  Findings: ${intel.findings?.length || 0}`);
  console.log(`  Null signal: ${intel.null_signal || false}`);

  return intel;
}

// ── Publish to Supabase ────────────────────────────────────────

async function publishToSupabase(intel) {
  const dateString = intel.date;
  console.log(`\nPublishing to Supabase: vigil_intel for ${dateString}`);

  // Check if already exists
  const { data: existing } = await getSupabase()
    .from('vigil_intel')
    .select('id')
    .eq('scan_date', dateString)
    .single();

  const record = {
    scan_date: dateString,
    scan_version: intel.scan_version || '1.0',
    source_stats: intel.source_stats,
    findings: intel.findings || [],
    null_signal: intel.null_signal || false,
    null_reason: intel.null_reason || null,
    deliberated: false,
  };

  if (existing) {
    console.log('  Record exists, updating...');
    const { error } = await getSupabase()
      .from('vigil_intel')
      .update(record)
      .eq('scan_date', dateString);
    if (error) throw error;
  } else {
    const { error } = await getSupabase()
      .from('vigil_intel')
      .insert(record);
    if (error) throw error;
  }

  console.log('  Published successfully!');
}

// ── Save local copy ────────────────────────────────────────────

function saveLocalCopy(intel) {
  try {
    if (!existsSync(LOCAL_OUTPUT_DIR)) {
      mkdirSync(LOCAL_OUTPUT_DIR, { recursive: true });
    }
    const filePath = join(LOCAL_OUTPUT_DIR, `${intel.date}.json`);
    writeFileSync(filePath, JSON.stringify(intel, null, 2));
    console.log(`  Local copy saved: ${filePath}`);
  } catch (error) {
    // Non-fatal: local save is a convenience, not a requirement
    // (may fail in GitHub Actions where Dropbox path doesn't exist)
    console.log(`  Local save skipped: ${error.message}`);
  }
}

// ── Main ───────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('VDISIP: VIGIL Daily Intelligence Scanner');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : FORCE_REGENERATE ? 'FORCE' : 'LIVE'}`);
  console.log('='.repeat(60));

  // Load sources
  const sourcesPath = join(__dirname, 'sources.json');
  const sources = JSON.parse(readFileSync(sourcesPath, 'utf-8'));

  const enabledRSS = sources.rss.filter(s => s.enabled);
  const enabledAPI = sources.api.filter(s => s.enabled);
  console.log(`\nSources: ${enabledRSS.length} RSS, ${enabledAPI.length} API`);

  // Check for existing scan
  const today = new Date();
  const targetDate = DATE_OVERRIDE || today.toISOString().split('T')[0];

  if (!DRY_RUN && !FORCE_REGENERATE && process.env.SUPABASE_URL) {
    const { data: existing } = await getSupabase()
      .from('vigil_intel')
      .select('id')
      .eq('scan_date', targetDate)
      .single();

    if (existing) {
      console.log(`\nScan for ${targetDate} already exists. Use --force to regenerate.`);
      process.exit(0);
    }
  }

  // ── Fetch all sources in parallel ──

  console.log('\n--- Fetching RSS feeds ---');
  const rssPromises = enabledRSS.map(fetchRSSFeed);

  console.log('\n--- Fetching API sources ---');
  const apiPromises = enabledAPI.map(source => {
    switch (source.type) {
      case 'reddit': return fetchReddit(source);
      case 'hackernews': return fetchHackerNews(source);
      case 'github-releases': return fetchGitHubReleases(source);
      case 'github-trending': return fetchGitHubTrending(source);
      default:
        console.warn(`  Unknown source type: ${source.type}`);
        return Promise.resolve([]);
    }
  });

  const [rssResults, apiResults] = await Promise.all([
    Promise.all(rssPromises),
    Promise.all(apiPromises),
  ]);

  const allItems = [...rssResults.flat(), ...apiResults.flat()];
  console.log(`\nTotal items fetched: ${allItems.length}`);

  const sourcesChecked = enabledRSS.length + enabledAPI.length;

  // ── Deduplicate ──

  console.log('\n--- Deduplicating ---');
  const deduplicated = deduplicateItems(allItems);
  console.log(`After dedup: ${deduplicated.length} unique items`);

  // ── Fetch DAINS context ──

  console.log('\n--- DAINS Cross-reference ---');
  const dainsContext = process.env.SUPABASE_URL ? await fetchDAINSContext() : null;
  if (!process.env.SUPABASE_URL) console.log('  Skipped (no SUPABASE_URL)');

  // ── Handle empty results ──

  if (deduplicated.length === 0) {
    console.log('\nNo items found from any source.');
    const emptyIntel = {
      date: targetDate,
      scan_version: '1.0',
      source_stats: {
        sources_checked: sourcesChecked,
        items_fetched: 0,
        items_after_dedup: 0,
        items_after_relevance_filter: 0,
      },
      findings: [],
      null_signal: true,
      null_reason: 'No items fetched from any source. Possible: all sources returned errors or no recent content.',
    };

    if (!DRY_RUN) {
      await publishToSupabase(emptyIntel);
      saveLocalCopy(emptyIntel);
    } else {
      console.log('\n--- DRY RUN OUTPUT ---');
      console.log(JSON.stringify(emptyIntel, null, 2));
    }
    return;
  }

  // ── Synthesize with Claude ──

  let intel;
  if (DRY_RUN && !process.env.ANTHROPIC_API_KEY) {
    // In dry-run without API key, output raw items instead of synthesizing
    console.log('\n  Dry run without ANTHROPIC_API_KEY: skipping Claude synthesis');
    intel = {
      date: targetDate,
      scan_version: '1.0',
      source_stats: {},
      findings: deduplicated.slice(0, 20).map((item, i) => ({
        id: `f-${targetDate}-${String(i + 1).padStart(3, '0')}`,
        title: item.title,
        source: item.source,
        url: item.url,
        category: 'unscored',
        relevance_score: null,
        is_concrete: null,
        summary: (item.content || '').slice(0, 200),
        potential_application: 'Pending Claude scoring',
      })),
      null_signal: false,
      null_reason: null,
      _note: 'Raw items, not scored by Claude (dry-run without API key)',
    };
  } else {
    intel = await synthesizeIntel(deduplicated, dainsContext, targetDate);
  }

  // Enrich source_stats with our counts (Claude may not have accurate raw numbers)
  intel.source_stats = {
    ...intel.source_stats,
    sources_checked: sourcesChecked,
    items_fetched: allItems.length,
    items_after_dedup: deduplicated.length,
    items_after_relevance_filter: intel.findings?.length || 0,
  };

  // ── Output ──

  if (DRY_RUN) {
    console.log('\n--- DRY RUN OUTPUT ---');
    console.log(JSON.stringify(intel, null, 2));
    console.log('\n--- END DRY RUN ---');
    return;
  }

  await publishToSupabase(intel);
  saveLocalCopy(intel);

  console.log('\n' + '='.repeat(60));
  console.log('VDISIP SCAN COMPLETE');
  console.log(`Date: ${targetDate}`);
  console.log(`Findings: ${intel.findings?.length || 0}`);
  console.log(`Null signal: ${intel.null_signal || false}`);
  console.log('='.repeat(60));
}

// Run
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\nFATAL ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
