/**
 * story-rows.mjs
 *
 * PURE transform: DAINS story clusters in, ai-wire database rows out.
 *
 * No I/O, no network, no clock reads (the caller supplies `now`), no module-level
 * side effects. Importing this file does nothing but define functions.
 *
 * Input shape is exactly what clusterNewsletterItems() in ai-daily-intel/build-scan.js
 * produces, after matchClustersToRSS() has optionally attached a primarySource:
 *
 *   {
 *     headline:    string,
 *     summary:     string,
 *     source_url:  string,
 *     entities:    string[] | null,
 *     hits: [{ newsletter, headline, summary, source_url, entities, id }],
 *     primarySource?: { title, url, publisher }
 *   }
 *
 * Output columns are the ones named in CONTRACT.md. Columns the database owns
 * (id, ups, downs, hot, reaction_counts, created_at) are never produced here.
 */

import { createHash } from 'node:crypto';

/**
 * Clean URL by removing tracking parameters.
 *
 * Copied verbatim from ai-daily-intel/build-scan.js (function cleanUrl) so that a
 * URL canonicalized here is byte-identical to the URL DAINS itself publishes.
 * If that function ever changes, this copy must be updated with it.
 */
export function cleanUrl(url) {
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

/** Placeholder DAINS uses when a story has no source URL (see ai-daily-intel/CLAUDE.md). */
export const NO_URL = '#';

/**
 * Domain recorded when no real publisher can be determined for a story.
 *
 * Two ways to land here, and both are honest answers rather than a guess:
 *   - the story has no usable link at all;
 *   - every link it has is a redirect wrapper whose destination cannot be read
 *     out of the URL itself, so the publisher behind it is genuinely unknown.
 * Saying 'unknown' is the point. The alternative that shipped before this was
 * substituting whatever domain happened to be in front, which is how the wire
 * ended up printed as the publisher of a DeepSeek story.
 */
export const UNKNOWN_DOMAIN = 'unknown';

/**
 * The domains this wire itself publishes on.
 *
 * A board whose whole claim is "one story, shown with its many sources" may
 * never name itself as one of those sources. victordelrosal.com is where the
 * scan is published, so a link to it is a link back to this board, not to a
 * publisher. It is never a story's display domain and never becomes a source
 * row: it is dropped from the candidate list entirely, before anything else
 * looks at it.
 */
export const WIRE_OWN_DOMAINS = ['victordelrosal.com'];

/**
 * Hostnames that carry a click somewhere else and publish nothing themselves.
 *
 * Two kinds are in here:
 *   - aggregator redirects: news.google.com hands out an opaque token that
 *     resolves to a publisher only by asking Google, which this transform must
 *     never do (no network calls);
 *   - newsletter click trackers: links.tldrnewsletter.com and its kin count the
 *     click and forward.
 *
 * A domain in this set is never the publisher and is never labelled 'original'.
 * That label is a trust signal a reader uses to decide whether they are reading
 * an announcement or a report of one, and a Google redirect on a Google story
 * would otherwise claim it, because the registrable label of news.google.com is
 * literally 'google'.
 */
const REDIRECT_WRAPPER_DOMAINS = new Set([
  'news.google.com',
  'news.url.google.com',
  'feedproxy.google.com',
  'links.tldrnewsletter.com',
  'tracking.tldrnewsletter.com',
  't.co',
  'lnkd.in',
  'bit.ly',
  'buff.ly',
  'ow.ly',
  'tinyurl.com',
  'rebrand.ly',
  'trib.al',
  'dlvr.it',
  'ift.tt',
  'flip.it',
  'shar.es',
  'po.st',
  'hubs.ly',
  'mailchi.mp',
]);

/**
 * Host prefixes that mark a tracker sitting in front of an otherwise real domain:
 * links.example.com, click.example.com, link.mail.beehiiv.com.
 *
 * Kept deliberately short. Every entry here costs an honest publisher its name
 * if it is wrong, so a prefix earns its place only when a host wearing it is a
 * forwarder rather than a page.
 */
const REDIRECT_WRAPPER_PREFIXES = [
  'links.', 'link.', 'click.', 'clicks.', 'track.', 'tracking.', 'trk.', 'redirect.',
];

/** Query parameters a wrapper uses to carry the destination it forwards to. */
const REDIRECT_TARGET_PARAMS = [
  'url', 'u', 'q', 'target', 'dest', 'destination', 'redirect', 'redirect_url', 'link', 'to', 'out',
];

/** True when a domain is this wire's own site, or any subdomain of it. */
export function isWireOwnDomain(domain) {
  const host = String(domain || '').toLowerCase().replace(/^www\./, '');
  if (!host) return false;
  return WIRE_OWN_DOMAINS.some(own => host === own || host.endsWith('.' + own));
}

/** True when a domain forwards clicks rather than publishing anything. */
export function isRedirectWrapper(domain) {
  const host = String(domain || '').toLowerCase().replace(/^www\./, '');
  if (!host) return false;
  if (REDIRECT_WRAPPER_DOMAINS.has(host)) return true;
  return REDIRECT_WRAPPER_PREFIXES.some(prefix => host.startsWith(prefix));
}

/**
 * The destination a redirect wrapper carries, when the URL itself carries it.
 *
 * Only wrapper hosts are unwrapped, so an ordinary article URL that happens to
 * have a ?url= parameter is left exactly as it is. Resolution is purely textual:
 * no request is made, ever. A wrapper that encodes its destination as an opaque
 * token (news.google.com does) comes back unchanged, which is the signal that
 * the publisher behind it is unknown rather than guessable.
 *
 * Bounded at 5 hops so a wrapper pointing at itself cannot spin.
 */
export function unwrapRedirect(url) {
  let current = String(url || '');
  for (let hop = 0; hop < 5; hop += 1) {
    if (!isUsableUrl(current)) return current;
    let parsed;
    try {
      parsed = new URL(current.trim());
    } catch {
      return current;
    }
    if (!isRedirectWrapper(parsed.hostname)) return current;

    let next = null;
    for (const param of REDIRECT_TARGET_PARAMS) {
      const value = parsed.searchParams.get(param);
      if (!value) continue;
      const candidate = value.trim();
      if (!isUsableUrl(candidate)) continue;
      if (candidate === current) continue;
      next = candidate;
      break;
    }
    if (!next) return current;
    current = next;
  }
  return current;
}

/** Subdomain labels that name a section of a site, never the company behind it. */
const GENERIC_LABELS = new Set([
  'www', 'blog', 'news', 'developer', 'developers', 'press', 'about', 'help',
  'docs', 'support', 'index', 'en', 'm', 'app', 'api', 'static', 'cdn', 'media',
]);

/** Two-label public suffixes common enough to matter for domain labelling. */
const MULTI_LABEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'com.au', 'net.au', 'org.au',
  'co.jp', 'co.nz', 'co.in', 'com.br', 'com.cn', 'co.za', 'com.mx',
]);

/**
 * True when a URL points somewhere a reader can actually go.
 * '#', '', null and anything that is not http(s) are all unusable.
 */
export function isUsableUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed === '' || trimmed === NO_URL) return false;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/** Hostname of a URL, lowercased, with a leading www. removed. Empty string if unparseable. */
export function domainOf(url) {
  if (!isUsableUrl(url)) return '';
  try {
    return new URL(url.trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * A link with no path is a site root: the newsletter's or publisher's front page, not this
 * story. It is fine to SHOW (it tells the reader who carried the story) and fatal to use as
 * IDENTITY, because every story carried by that newsletter resolves to the same root and the
 * global UNIQUE (url_hash) then silently drops all but the first.
 * Found by seeding a real database from a real fixture: 20 stories became 18, because two
 * pairs both fell back to theneuron.ai and therundown.ai. No unit test caught it, because
 * each story was individually correct.
 */
export function isSiteRoot(url) {
  try {
    const u = new URL(String(url));
    const path = (u.pathname || '/').replace(/\/+$/, '');
    return path === '' && !u.search;
  } catch {
    return false;
  }
}

/** sha256 hex of a string. */
export function sha256Hex(value) {
  return createHash('sha256').update(String(value), 'utf8').digest('hex');
}

/**
 * The REGISTRABLE label of a domain: the one label that identifies who owns it.
 *
 *   openai.com            -> ['openai']
 *   developer.nvidia.com  -> ['nvidia']
 *   pewresearch.org       -> ['pewresearch']
 *   example.co.uk         -> ['example']
 *   blog.google           -> ['google']    (brand top level domain)
 *   openai.com.evil.co    -> ['com']       (evil.co owns it; openai is a subdomain)
 *
 * Only the registrable label is returned, never the subdomains in front of it.
 * That last example is why: anyone can put any name in a subdomain, so a matcher
 * that considered every label would call openai.com.evil.co an OpenAI domain.
 */
function companyLabels(domain) {
  if (!domain) return [];
  const parts = domain.split('.').filter(Boolean);
  if (parts.length < 2) return parts;
  const lastTwo = parts.slice(-2).join('.');
  const drop = MULTI_LABEL_SUFFIXES.has(lastTwo) ? 2 : 1;
  const registrable = parts[parts.length - drop - 1];
  if (registrable && !GENERIC_LABELS.has(registrable)) return [registrable];
  // A brand top level domain such as blog.google leaves only a generic label once
  // the suffix is dropped, so the suffix itself is the name: google.
  const suffix = parts[parts.length - 1];
  return GENERIC_LABELS.has(suffix) ? [] : [suffix];
}

/** Alphanumeric tokens of length >= 4, plus the whole phrase with separators stripped. */
function tokensFromPhrase(phrase) {
  if (!phrase || typeof phrase !== 'string') return [];
  const lower = phrase.toLowerCase();
  const joined = lower.replace(/[^a-z0-9]/g, '');
  const words = lower.split(/[^a-z0-9]+/).filter(w => w.length >= 4);
  const all = joined.length >= 4 ? [joined, ...words] : words;
  return [...new Set(all)];
}

/**
 * A domain label reduced to comparable form: lowercase, punctuation removed.
 * 'not-openai' -> 'notopenai'. Hyphens are STRIPPED, never split on, because
 * splitting is exactly what lets 'not-openai.com' pass itself off as OpenAI.
 */
function normalizeLabel(label) {
  return String(label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Origin labelling for one source of one story.
 *
 * 'original' when the linked domain IS the domain of a company or organisation the
 * story is about: an OpenAI story linking openai.com, an NVIDIA story linking
 * developer.nvidia.com. Everything else is 'reporting'.
 *
 * Names come from the story entities. When a cluster carries no entities at all,
 * the headline supplies the names instead, which is the only way the empty-entity
 * case can ever be labelled 'original'.
 *
 * THE MATCH IS EXACT, AND THAT IS THE WHOLE POINT.
 *
 * This used to accept a substring match in either direction, so every one of these
 * was labelled 'original' and shown to a reader as the company speaking for itself:
 *
 *   not-openai.com          on an OpenAI story    ('openai' is inside 'not-openai')
 *   fakeanthropic.io        on an Anthropic story ('anthropic' is inside 'fakeanthropic')
 *   openai-news-blog.com    on an OpenAI story    ('openai' is inside 'openai-news-blog')
 *   metafilter.com          on a Meta story       ('meta' is inside 'metafilter')
 *
 * 'original' is a trust label. A reader uses it to decide whether they are reading
 * the announcement or a report of the announcement, and the first three domains
 * above are what a phishing or spoofing domain looks like. So the registrable label
 * of the domain must EQUAL the name, after both are reduced to letters and digits.
 * A registrable label that merely contains the name is a different organisation.
 *
 * Labels shorter than 4 characters never match, so a two letter entity like 'AI'
 * cannot claim ai.com.
 */
export function originKind(domain, entities, headline) {
  // A forwarder is never the thing it forwards to. news.google.com reduces to the
  // registrable label 'google', so without this line a Google redirect on a Google
  // story is presented to a reader as Google speaking for itself. The wire's own
  // site is refused for the same reason: it reports, it does not originate.
  if (isRedirectWrapper(domain) || isWireOwnDomain(domain)) return 'reporting';

  const labels = companyLabels(domain).map(normalizeLabel).filter(Boolean);
  if (labels.length === 0) return 'reporting';

  const names = Array.isArray(entities) ? entities.filter(e => typeof e === 'string' && e.trim()) : [];
  const phrases = names.length > 0 ? names : [headline || ''];

  const tokens = new Set();
  for (const phrase of phrases) {
    for (const token of tokensFromPhrase(phrase)) tokens.add(token);
  }

  for (const label of labels) {
    if (label.length < 4) continue;
    if (tokens.has(label)) return 'original';
  }
  return 'reporting';
}

/** Deduped, trimmed, order-preserving entity list. Never null. */
function normalizeEntities(...lists) {
  const out = [];
  const seen = new Set();
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const raw of list) {
      if (typeof raw !== 'string') continue;
      const value = raw.trim();
      if (!value) continue;
      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(value);
    }
  }
  return out;
}

/** Headline reduced to a stable identity key, used only when a story has no usable URL. */
function headlineKey(headline) {
  return String(headline || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Every URL a cluster offers, in priority order, cleaned and unwrapped. */
function linkCandidates(cluster) {
  const raw = [
    cluster?.primarySource?.url,
    cluster?.source_url,
    ...(Array.isArray(cluster?.hits) ? cluster.hits.map(h => h?.source_url) : []),
  ];
  const out = [];
  for (const candidate of raw) {
    const cleaned = cleanUrl(candidate);
    if (!isUsableUrl(cleaned)) continue;
    out.push(unwrapRedirect(cleaned));
  }
  return out;
}

/**
 * The canonical primary link for a cluster, and the domain shown to a reader as
 * the story's publisher. These are two different questions and this function had
 * been answering only the first, which is how 8 of 20 cards on the board named a
 * domain that was not the publisher.
 *
 * THE LINK is the first candidate a reader can actually follow, in the order
 * primarySource, then the cluster's own source_url, then the hits. A redirect
 * wrapper is kept as the link when nothing better exists, because following it
 * does reach the article; what it may not do is claim to be the publisher.
 *
 * THE DISPLAY DOMAIN, exactly as the frozen rule states it:
 *   - from cluster.primarySource.url when present;
 *   - otherwise from the canonical url, after known redirect wrappers are
 *     unwrapped;
 *   - and never this wire's own site.
 * When the resulting host is still a wrapper, or is the wire itself, or there is
 * no link at all, the domain is UNKNOWN_DOMAIN. The data then says the publisher
 * is unknown, which is true, instead of naming whoever was standing nearest.
 *
 * This wire's own domain is dropped from the candidate list before any of that,
 * so it can be neither the link nor the display domain.
 *
 * Returns { url, domain, hasLink, publisherKnown }.
 */
export function primaryLinkFor(cluster) {
  const candidates = linkCandidates(cluster).filter(u => !isWireOwnDomain(domainOf(u)));
  const url = candidates.length > 0 ? candidates[0] : NO_URL;
  const hasLink = candidates.length > 0;

  // The primary source names the publisher when there is one and it is real.
  const primary = cleanUrl(cluster?.primarySource?.url);
  let publisher = null;
  if (isUsableUrl(primary)) {
    const unwrapped = unwrapRedirect(primary);
    const domain = domainOf(unwrapped);
    if (domain && !isWireOwnDomain(domain) && !isRedirectWrapper(domain)) publisher = domain;
  }

  // Otherwise the canonical url does, if it is a publisher rather than a forwarder.
  if (!publisher && hasLink) {
    const domain = domainOf(url);
    if (domain && !isRedirectWrapper(domain)) publisher = domain;
  }

  return {
    url,
    domain: publisher || UNKNOWN_DOMAIN,
    hasLink,
    publisherKnown: Boolean(publisher),
  };
}

/** A Date, ISO string or epoch number as an ISO string. null when unusable. */
function toIsoOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function toIso(value) {
  const iso = toIsoOrNull(value);
  return iso === null ? new Date(0).toISOString() : iso;
}

/**
 * A lookup from newsletter_items id to that item's email_received_at, built from
 * whatever the caller supplied. Accepts:
 *   options.items      the newsletter_items rows build-scan.js already holds
 *   options.itemsById  a Map or plain object of id -> row, or id -> timestamp
 * Returns a Map of id -> ISO string. Empty when the caller supplied nothing,
 * which is the case the run-time fallback exists for.
 */
function receivedAtById(options) {
  const out = new Map();

  const put = (id, value) => {
    if (id === null || id === undefined || id === '') return;
    const iso = toIsoOrNull(value);
    if (iso) out.set(String(id), iso);
  };

  const fromRow = (row, keyedId) => {
    if (!row) return;
    if (typeof row === 'string' || typeof row === 'number' || row instanceof Date) {
      put(keyedId, row);
      return;
    }
    if (typeof row !== 'object') return;
    const id = keyedId === undefined ? row.id : keyedId;
    put(id, row.email_received_at || row.emailReceivedAt || row.received_at);
  };

  for (const row of Array.isArray(options && options.items) ? options.items : []) {
    fromRow(row, undefined);
  }

  const byId = options && options.itemsById;
  if (byId instanceof Map) {
    for (const [id, row] of byId) fromRow(row, id);
  } else if (byId && typeof byId === 'object') {
    for (const [id, row] of Object.entries(byId)) fromRow(row, id);
  }

  return out;
}

/**
 * When a story FIRST appeared, which is when its age starts.
 *
 * The earliest email_received_at across the newsletter items this cluster is made
 * of. A hit that carries its own email_received_at is honoured directly, so a
 * caller that enriched the hits does not also have to pass the items.
 * Returns null when nothing in the cluster carries a timestamp.
 *
 * ISO strings in UTC compare correctly with <, which is why they are compared as
 * strings here rather than being turned back into Dates.
 */
function firstSeenIso(cluster, lookup) {
  const hits = Array.isArray(cluster && cluster.hits) ? cluster.hits : [];
  let earliest = null;
  for (const hit of hits) {
    if (!hit) continue;
    let iso = toIsoOrNull(hit.email_received_at);
    if (!iso && hit.id !== undefined && hit.id !== null) {
      iso = lookup.get(String(hit.id)) || null;
    }
    if (!iso) continue;
    if (earliest === null || iso < earliest) earliest = iso;
  }
  return earliest;
}

function scanDateFromSlug(slug) {
  const match = String(slug || '').match(/(\d{4}-\d{2}-\d{2})$/);
  return match ? match[1] : null;
}

/**
 * Convert DAINS clusters into scan_stories rows and scan_story_sources rows.
 *
 * @param {Array} clusters  output of clusterNewsletterItems(), optionally RSS-matched
 * @param {Object} options
 * @param {string} options.scanSlug  daily-ai-news-scan-YYYY-MM-DD
 * @param {string} [options.scanDate]  YYYY-MM-DD; derived from the slug when omitted
 * @param {Date|string|number} [options.now]  run instant, used only as a fallback
 * @param {Array}  [options.items]  the newsletter_items rows this scan clustered
 * @param {Map|Object} [options.itemsById]  the same thing already keyed by id
 * @returns {{stories: Array, sources: Array}}
 *
 * Story rows carry every scan_stories column this pipeline owns. Source rows carry the
 * four scan_story_sources columns plus story_url_hash, which is the join key the persist
 * layer swaps for the real story_id once the database has assigned one.
 *
 * Three guarantees the caller depends on:
 *
 *   - source_count is EXACTLY the number of scan_story_sources rows written for that
 *     story. Not hits.length, which is what it used to be. The two differ constantly:
 *     the RSS fallback branch of build-scan.js builds its stories with hits: [] and a
 *     primarySource, so every one of those cards read "0 sources" and then expanded to
 *     reveal one; and a hit whose source_url is '#' or missing produces no row, so a
 *     three hit story with one link read "3 sources" and expanded to reveal one. The
 *     number on the card and the list behind the card are now the same list. It can be
 *     0, for a story every one of whose hits arrived with no usable link, which is why
 *     the migration's CHECK on source_count allows 0.
 *
 *   - published_at is when the story FIRST appeared: the earliest email_received_at
 *     among the newsletter items this cluster is made of. It used to be computed once,
 *     outside the loop, so all ten stories of a day shared one instant. That made
 *     Latest an N-way tie with no defined order, and made the recency term constant
 *     within a day, so Hot collapsed to the score alone. options.items or
 *     options.itemsById supplies the timestamps; when neither is given, or a cluster
 *     has none, the run instant is the fallback, which is also the right answer for
 *     the RSS fallback branch, where there are no newsletter items behind the story.
 *
 *   - url_hash is unique across the returned stories, so the global UNIQUE (url_hash)
 *     constraint can never be violated by a single scan.
 */
export function clustersToRows(clusters, options = {}) {
  const scanSlug = options.scanSlug || '';
  const scanDate = options.scanDate || scanDateFromSlug(scanSlug) || toIso(options.now).slice(0, 10);
  const runInstant = toIso(options.now === undefined || options.now === null ? new Date(0) : options.now);
  const receivedAt = receivedAtById(options);

  const stories = [];
  const sources = [];
  const byHash = new Map();          // url_hash -> story row
  const sourceKeys = new Set();      // url_hash + ' ' + source url
  const sourceCounts = new Map();    // url_hash -> source rows actually written

  for (const cluster of Array.isArray(clusters) ? clusters : []) {
    if (!cluster || typeof cluster !== 'object') continue;

    const headline = String(cluster.headline || '').trim();
    if (!headline) continue;

    const hits = Array.isArray(cluster.hits) ? cluster.hits : [];
    const { url, domain, hasLink } = primaryLinkFor(cluster);

    // A story with no usable link still needs a stable, collision-free identity, or
    // every link-less story in history would share the url_hash of '#'.
    // Identity comes from the ARTICLE. A site root or a missing link both fall back to the
    // headline key, so two stories carried by one newsletter stay two stories.
    const identifiesTheStory = hasLink && !isSiteRoot(url);
    const hashInput = identifiesTheStory
      ? url
      : `dains:headline:${headlineKey(headline)}`;
    const urlHash = sha256Hex(hashInput);

    const entities = normalizeEntities(cluster.entities, ...hits.map(h => h?.entities));
    const firstSeen = firstSeenIso(cluster, receivedAt);

    let story = byHash.get(urlHash);
    if (story) {
      // Two clusters canonicalized to the same link. One story, one row, and the
      // story is as old as the EARLIER of the two sightings.
      story.entities = normalizeEntities(story.entities, entities);
      if (!story.summary && cluster.summary) story.summary = String(cluster.summary).trim();
      if (firstSeen && firstSeen < story.published_at) story.published_at = firstSeen;
    } else {
      story = {
        scan_slug: scanSlug,
        scan_date: scanDate,
        headline,
        summary: cluster.summary ? String(cluster.summary).trim() : '',
        url,
        url_hash: urlHash,
        domain,
        source_count: 0,   // replaced below by the source rows actually written
        entities,
        published_at: firstSeen || runInstant,
      };
      byHash.set(urlHash, story);
      stories.push(story);
    }

    // Source rows: the RSS primary source first, then every hit with a usable link.
    const candidates = [];
    if (cluster.primarySource?.url) {
      candidates.push({
        url: cluster.primarySource.url,
        name: cluster.primarySource.publisher || cluster.primarySource.title || 'Unknown',
      });
    }
    for (const hit of hits) {
      candidates.push({ url: hit?.source_url, name: hit?.newsletter || 'Unknown' });
    }

    for (const candidate of candidates) {
      const cleanedRaw = cleanUrl(candidate.url);
      if (!isUsableUrl(cleanedRaw)) continue;      // '#' and blanks are not linkable sources
      const cleaned = unwrapRedirect(cleanedRaw);  // a tracker resolves to the page it forwards to
      // The wire never cites itself. A link back to victordelrosal.com is a link
      // back to this board, and counting it would inflate "N sources" with a source
      // that is the board the reader is already looking at.
      if (isWireOwnDomain(domainOf(cleaned))) continue;
      const key = `${urlHash} ${cleaned}`;
      if (sourceKeys.has(key)) continue;            // PRIMARY KEY (story_id, url)
      sourceKeys.add(key);

      const sourceDomain = domainOf(cleaned);
      sources.push({
        story_url_hash: urlHash,
        url: cleaned,
        name: String(candidate.name).trim() || 'Unknown',
        domain: sourceDomain,
        kind: originKind(sourceDomain, story.entities, headline),
      });
      sourceCounts.set(urlHash, (sourceCounts.get(urlHash) || 0) + 1);
    }
  }

  // source_count is DERIVED from the source rows, never counted in parallel with
  // them. Written this way the number on the card and the list behind the card
  // cannot drift apart, whatever a later edit does to either.
  for (const story of stories) {
    story.source_count = sourceCounts.get(story.url_hash) || 0;
  }

  return { stories, sources };
}

export default clustersToRows;
