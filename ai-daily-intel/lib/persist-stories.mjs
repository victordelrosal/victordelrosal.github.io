/**
 * persist-stories.mjs
 *
 * The thin write layer between DAINS clusters and the ai-wire tables.
 *
 * Import safety: this module creates no client, reads no environment variable and
 * opens no socket at import time. The Supabase client is passed in by the caller,
 * which is the same client build-scan.js already holds.
 *
 * Failure policy: persistStories never throws. It returns a result object. The daily
 * scan must publish whether or not the wire tables accept a row, so the caller logs
 * the result and carries on.
 *
 * Why not a single .upsert():
 *   published_at drives `hot` and CONTRACT.md says it is never mutated after insert.
 *   A blanket upsert would rewrite it every day and quietly reset the age of every
 *   story that reappears. So: read the existing url_hashes, insert the new rows in
 *   full, and touch only source_count, scan_slug and scan_date on the ones that exist.
 */

import { clustersToRows } from './story-rows.mjs';

export const STORIES_TABLE = 'scan_stories';
export const SOURCES_TABLE = 'scan_story_sources';

function message(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  return error.message || String(error);
}

/**
 * Persist one scan's clusters as story rows and source rows.
 *
 * @param {Object} supabase  an initialised @supabase/supabase-js client
 * @param {Array}  clusters  clusterNewsletterItems() output for this scan
 * @param {Object} options   { scanSlug, scanDate, now, tables? }
 * @returns {Promise<Object>} {
 *   ok, inserted, updated, sources, storyCount, skipped, error
 * }
 */
export async function persistStories(supabase, clusters, options = {}) {
  const result = {
    ok: false,
    inserted: 0,
    updated: 0,
    sources: 0,
    storyCount: 0,
    skipped: false,
    error: null,
  };

  try {
    if (!supabase || typeof supabase.from !== 'function') {
      result.skipped = true;
      result.error = 'no supabase client supplied';
      return result;
    }

    const storiesTable = options.tables?.stories || STORIES_TABLE;
    const sourcesTable = options.tables?.sources || SOURCES_TABLE;

    const { stories, sources } = clustersToRows(clusters, options);
    result.storyCount = stories.length;

    if (stories.length === 0) {
      result.ok = true;
      result.skipped = true;
      return result;
    }

    const hashes = stories.map(s => s.url_hash);

    // 1. Which of these stories does the wire already know about?
    const existing = await supabase
      .from(storiesTable)
      .select('id, url_hash')
      .in('url_hash', hashes);

    if (existing.error) {
      result.error = message(existing.error);
      return result;
    }

    const idByHash = new Map();
    for (const row of existing.data || []) idByHash.set(row.url_hash, row.id);
    const alreadyKnown = new Set(idByHash.keys());

    // 2. Insert the genuinely new ones, published_at and all.
    const fresh = stories.filter(s => !idByHash.has(s.url_hash));
    if (fresh.length > 0) {
      const inserted = await supabase
        .from(storiesTable)
        .insert(fresh)
        .select('id, url_hash');

      if (inserted.error) {
        result.error = message(inserted.error);
        return result;
      }
      for (const row of inserted.data || []) idByHash.set(row.url_hash, row.id);
      result.inserted = (inserted.data || []).length;
    }

    // 3. On conflict, move only what a new day legitimately changes.
    //    Never published_at, never ups, downs, hot or reaction_counts.
    for (const story of stories) {
      if (!alreadyKnown.has(story.url_hash)) continue;

      const updated = await supabase
        .from(storiesTable)
        .update({
          source_count: story.source_count,
          scan_slug: story.scan_slug,
          scan_date: story.scan_date,
        })
        .eq('url_hash', story.url_hash);

      if (updated.error) {
        result.error = message(updated.error);
        return result;
      }
      result.updated += 1;
    }

    // 4. Sources, keyed to real story ids. PRIMARY KEY (story_id, url) makes this idempotent.
    const sourceRows = [];
    for (const source of sources) {
      const storyId = idByHash.get(source.story_url_hash);
      if (!storyId) continue;
      sourceRows.push({
        story_id: storyId,
        url: source.url,
        name: source.name,
        domain: source.domain,
        kind: source.kind,
      });
    }

    if (sourceRows.length > 0) {
      const upserted = await supabase
        .from(sourcesTable)
        .upsert(sourceRows, { onConflict: 'story_id,url' });

      if (upserted.error) {
        result.error = message(upserted.error);
        return result;
      }
      result.sources = sourceRows.length;
    }

    result.ok = true;
    return result;
  } catch (error) {
    result.error = message(error);
    return result;
  }
}

export default persistStories;
