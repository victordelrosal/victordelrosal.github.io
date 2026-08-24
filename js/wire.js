/**
 * The AI Wire board: /wire/
 *
 * Reads story rows (and their sources) either from a local fixture file or from Supabase
 * PostgREST, exactly the way js/posts.js talks to the REST API: apikey header, select and
 * order in the query string. Writes go nowhere near PostgREST; every vote is a POST to the
 * vote Edge Function described in CONTRACT.md, and it is applied optimistically with a
 * rollback on any non-2xx reply.
 *
 * Query parameters honoured (used by scripts/render-board.mjs, harmless in production):
 *   ?fixture=/fixtures/stories.json   read the board from a local JSON file
 *   ?voteBase=/api                    point the vote endpoint somewhere else
 *   ?tab=latest                       open on a given tab
 *
 * Voting needs two things the first version of this file did not send: a Turnstile
 * token (contract rule 3) and credentials, so the wire_sess cookie can travel. Both
 * are handled in postVote() below.
 */
(function () {
  'use strict';

  var REACTIONS = [
    { kind: 'like', glyph: '👍', label: 'Like' },
    { kind: 'love', glyph: '❤️', label: 'Love' },
    { kind: 'useful', glyph: '🔧', label: 'Useful' },
    { kind: 'witty', glyph: '✨', label: 'Witty' },
    { kind: 'doubt', glyph: '🤨', label: 'Doubt' },
    { kind: 'laugh', glyph: '😂', label: 'Laugh' }
  ];

  var HOT_EPOCH = 1134028003;

  /*
   * The Contested badge.
   *
   * CONTESTED_RATIO alone fires at N=1: one person clicks Doubt on a story nobody
   * else has reacted to, the ratio is 1.0, and every later reader sees the story
   * branded. A badge that permanent needs more than one opinion behind it, so a
   * floor of MIN_CONTESTED_REACTIONS total reactions must be crossed first.
   *
   * The number is 5. It is the smallest count where the ratio test is doing real
   * work: at 5 reactions a badge needs at least 2 doubts (2/5 = 0.40 > 0.30), so
   * it can never be one person's opinion, and 5 is still low enough that a genuinely
   * disputed story earns the badge inside the first hour rather than the next day.
   */
  var CONTESTED_RATIO = 0.30;
  var MIN_CONTESTED_REACTIONS = 5;

  /* Session TTL of the wire_sess cookie the vote function sets: lib.ts SESSION_TTL_SECONDS. */
  var SESSION_TTL_MS = 86400 * 1000;

  var params = new URLSearchParams(window.location.search);

  /**
   * Only http and https may become an href. Story links come from newsletter email content,
   * which is third-party text this project does not control, so a javascript: or data: URL is
   * an achievable XSS on victordelrosal.com rather than a theoretical one.
   */
  function safeHttpUrl(raw) {
    if (!raw) return null;
    try {
      var u = new URL(String(raw), window.location.origin);
      return (u.protocol === 'http:' || u.protocol === 'https:') ? u.href : null;
    } catch (err) {
      return null;
    }
  }

  /**
   * A same-origin RELATIVE path only. voteBase and fixture are development conveniences, and
   * taking either from the query string let any crafted link redirect the vote POST, which
   * carries the project anon key in an Authorization header, the Turnstile token in the body,
   * and the session cookie via credentials: include. Absolute URLs are refused outright.
   */
  function sameOriginPath(raw) {
    if (!raw) return null;
    var s = String(raw);
    return (s.charAt(0) === '/' && s.charAt(1) !== '/' && s.indexOf('\\') === -1) ? s : null;
  }

  var config = (function () {
    var supplied = window.WIRE_CONFIG || {};
    var site = window.__SUPABASE_CONFIG || {};
    var base = supplied.supabaseUrl || site.url || '';
    return {
      fixture: sameOriginPath(params.get('fixture')) || supplied.fixture || null,
      restBase: supplied.restBase || (base ? base + '/rest/v1' : ''),
      voteBase: sameOriginPath(params.get('voteBase')) || supplied.voteBase || (base ? base + '/functions/v1' : ''),
      anonKey: supplied.anonKey || site.anonKey || '',
      // Public Turnstile Site Key. Set in /wire/index.html; see functions/vote/README.md.
      turnstileSiteKey: supplied.turnstileSiteKey || window.WIRE_TURNSTILE_SITE_KEY || '',
      limit: supplied.limit || 60
    };
  })();

  var state = {
    tab: params.get('tab') === 'latest' ? 'latest' : 'hot',
    stories: [],
    byId: {},
    myVotes: readStore('wire.votes'),
    myReactions: readStore('wire.reactions'),
    voterUuid: voterUuid(),
    /* The in-flight vote, so a harness can await the round trip instead of sleeping. */
    pending: Promise.resolve()
  };

  var board = document.getElementById('wire-board');
  var status = document.getElementById('wire-status');

  /* ---------- small helpers ---------- */

  function readStore(key) {
    try {
      var raw = window.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (err) {
      return {};
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      /* private mode or blocked storage: the board still works, it just forgets */
    }
  }

  function voterUuid() {
    var existing;
    try {
      existing = window.localStorage.getItem('wire.voter');
    } catch (err) {
      existing = null;
    }
    if (existing) return existing;
    var fresh = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : 'v-' + Date.now().toString(16) + '-' + Math.random().toString(16).slice(2);
    try {
      window.localStorage.setItem('wire.voter', fresh);
    } catch (err) {
      /* nothing to do: an in-memory voter id is still a valid voter id for this visit */
    }
    return fresh;
  }

  function num(value) {
    var n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  /** Reddit hot, exactly as frozen in CONTRACT.md. sourceCount never enters it. */
  function hotOf(story) {
    var score = num(story.ups) - num(story.downs);
    var sign = score > 0 ? 1 : (score < 0 ? -1 : 0);
    var order = Math.log10(Math.max(Math.abs(score), 1));
    var seconds = Date.parse(story.published_at);
    seconds = Number.isFinite(seconds) ? seconds / 1000 : HOT_EPOCH;
    return sign * order + (seconds - HOT_EPOCH) / 45000.0;
  }

  function ageLabel(published) {
    var then = Date.parse(published);
    if (!Number.isFinite(then)) return 'just now';
    var mins = Math.floor((Date.now() - then) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm';
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h';
    var days = Math.floor(hours / 24);
    if (days < 30) return days + 'd';
    var months = Math.floor(days / 30);
    if (months < 12) return months + 'mo';
    return Math.floor(days / 365) + 'y';
  }

  /** "24 Aug": the calendar date a story carries, distinct from how fresh it is. */
  function dateLabel(published) {
    var d = new Date(published);
    if (isNaN(d.getTime())) return '';
    var now = new Date();
    var opts = { day: 'numeric', month: 'short' };
    if (d.getFullYear() !== now.getFullYear()) opts.year = 'numeric';
    return d.toLocaleDateString('en-GB', opts);
  }

  /** The unabbreviated date, for the tooltip. */
  function fullDateLabel(published) {
    var d = new Date(published);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function reactionCounts(story) {
    var raw = story.reaction_counts;
    if (typeof raw === 'string') {
      try {
        raw = JSON.parse(raw);
      } catch (err) {
        raw = {};
      }
    }
    if (!raw || typeof raw !== 'object') raw = {};
    var out = {};
    REACTIONS.forEach(function (r) {
      out[r.kind] = num(raw[r.kind]);
    });
    return out;
  }

  function isContested(counts) {
    var total = REACTIONS.reduce(function (sum, r) {
      return sum + num(counts[r.kind]);
    }, 0);
    // Floor first: a single Doubt click must never brand a story for every later reader.
    if (total < MIN_CONTESTED_REACTIONS) return false;
    return num(counts.doubt) / total > CONTESTED_RATIO;
  }

  /* ---------- data ---------- */

  function normalise(row) {
    var story = {
      id: String(row.id),
      headline: row.headline || 'Untitled story',
      summary: row.summary || '',
      url: row.url || '#',
      domain: row.domain || '',
      /*
       * NOT `num(...) || fallback`: a real source_count of 0 is falsy, so that idiom
       * silently promoted "no recorded source" into the claim "1 source" on a card whose
       * expand list was empty. Production data has 2 such stories in every 10, and the
       * board asserted a citation for both. Treat absent and zero as different things.
       */
      // sign(ups - downs). Voted stories rank above every unvoted one, by Victor's call:
      // log10(1) is zero, so under the plain hot formula a first upvote moved nothing at all.
      vote_tier: row.vote_tier === null || row.vote_tier === undefined
        ? Math.sign(num(row.ups) - num(row.downs))
        : num(row.vote_tier),
      source_count: row.source_count === null || row.source_count === undefined
        ? (Array.isArray(row.sources) ? row.sources.length : 1)
        : num(row.source_count),
      published_at: row.published_at,
      ups: num(row.ups),
      downs: num(row.downs),
      reaction_counts: reactionCounts(row),
      sources: Array.isArray(row.sources) ? row.sources : null,
      sourcesLoaded: Array.isArray(row.sources)
    };
    story.hot = hotOf(story);
    return story;
  }

  function fetchStories() {
    if (config.fixture) {
      return fetch(config.fixture, { cache: 'no-store' }).then(function (res) {
        if (!res.ok) throw new Error('fixture ' + res.status);
        return res.json();
      }).then(function (payload) {
        var rows = Array.isArray(payload) ? payload : (payload.stories || []);
        return rows.map(normalise);
      });
    }
    if (!config.restBase) return Promise.resolve([]);
    var url = config.restBase + '/scan_stories'
      + '?select=id,headline,summary,url,domain,source_count,published_at,ups,downs,reaction_counts'
      + '&order=vote_tier.desc,hot.desc&limit=' + config.limit;
    return fetch(url, { headers: { apikey: config.anonKey, 'Content-Type': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('stories ' + res.status);
        return res.json();
      })
      .then(function (rows) {
        return rows.map(normalise);
      });
  }

  function fetchSources(story) {
    if (story.sourcesLoaded) return Promise.resolve(story.sources || []);
    if (!config.restBase) return Promise.resolve([]);
    var url = config.restBase + '/scan_story_sources?select=name,url,domain,kind&story_id=eq.'
      + encodeURIComponent(story.id);
    return fetch(url, { headers: { apikey: config.anonKey, 'Content-Type': 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('sources ' + res.status);
        return res.json();
      })
      .then(function (rows) {
        story.sources = rows;
        story.sourcesLoaded = true;
        return rows;
      });
  }

  /* ---------- Turnstile ---------- */

  /*
   * Contract rule 3: a vote with no valid session cookie must carry a Turnstile
   * token, verified server side. The widget is invisible until Cloudflare decides
   * a human needs to prove something, so the common case is a click that just works.
   *
   * The flow:
   *   1. First vote of a session: execute the widget, wait for the token, send it.
   *   2. The function verifies it and sets the HttpOnly wire_sess cookie (24h).
   *   3. Later votes send no token; the cookie stands in. The cookie only travels
   *      because the request is sent with credentials: "include", which in turn is
   *      only allowed because the function answers with one exact origin plus
   *      Access-Control-Allow-Credentials, never "*".
   *   4. If the server says 403 anyway (cookie expired, rotated SESSION_SECRET),
   *      the stored session hint is dropped and the vote is retried once with a
   *      fresh token.
   *
   * The cookie is HttpOnly, so the page cannot read it. sessionHint() is only a
   * local guess at whether step 3 will work; the server is the authority and the
   * retry in step 4 is what makes a wrong guess harmless.
   */

  var turnstileWidget = null;
  var turnstilePending = null;

  function sessionHint() {
    var until = 0;
    try {
      until = Number(window.localStorage.getItem('wire.session') || 0);
    } catch (err) {
      until = 0;
    }
    return Number.isFinite(until) && until > Date.now();
  }

  function markSession(active) {
    try {
      if (active) {
        window.localStorage.setItem('wire.session', String(Date.now() + SESSION_TTL_MS));
      } else {
        window.localStorage.removeItem('wire.session');
      }
    } catch (err) {
      /* blocked storage: every vote then carries a fresh token, which still works */
    }
  }

  function turnstileReady() {
    return !!(window.turnstile && typeof window.turnstile.render === 'function');
  }

  function mountTurnstile() {
    if (turnstileWidget !== null) return turnstileWidget;
    var host = document.getElementById('wire-turnstile');
    if (!host || !turnstileReady() || !config.turnstileSiteKey) return null;
    turnstileWidget = window.turnstile.render(host, {
      sitekey: config.turnstileSiteKey,
      // Invisible until a challenge is actually needed, and only on demand.
      execution: 'execute',
      appearance: 'interaction-only',
      callback: function (token) {
        if (turnstilePending) turnstilePending.resolve(token);
      },
      'error-callback': function () {
        if (turnstilePending) turnstilePending.resolve('');
      },
      'timeout-callback': function () {
        if (turnstilePending) turnstilePending.resolve('');
      },
      'expired-callback': function () {
        markSession(false);
      }
    });
    return turnstileWidget;
  }

  /*
   * T5, the twenty-second silent stall.
   *
   * When the widget never calls back, the optimistic vote used to sit on screen for
   * twenty seconds with no request, no note and no spinner, and then quietly roll
   * back: measured at score 197, then 179 again at t=22s. Two changes:
   *
   *   1. The wait is now VISIBLE. turnstileToken reports "waiting" to its caller the
   *      moment it starts, and castArrow/castReaction put a line on the card.
   *   2. The wait is now SHORT. CHALLENGE_TIMEOUT_MS is six seconds, not twenty.
   *      Cloudflare's own interaction-only widget resolves in well under a second
   *      when it is going to resolve at all, so six seconds is generous for the
   *      working case and four times quicker to admit the broken one.
   *
   * On timeout the token resolves empty, the vote is sent without one, the server
   * answers 403, and the existing rollback puts the card back with a note. The
   * reader sees a result either way.
   */
  var CHALLENGE_TIMEOUT_MS = 6000;

  /** Resolves with a fresh token, or '' when Turnstile is unavailable on this page. */
  function turnstileToken(onWaiting) {
    var id = mountTurnstile();
    if (id === null || id === undefined) return Promise.resolve('');
    if (turnstilePending) {
      if (typeof onWaiting === 'function') onWaiting();
      return turnstilePending.promise;
    }

    var slot = {};
    slot.promise = new Promise(function (resolve) {
      var done = false;
      var watchdog = window.setTimeout(function () {
        slot.resolve('');
      }, CHALLENGE_TIMEOUT_MS);
      slot.resolve = function (token) {
        if (done) return;
        done = true;
        window.clearTimeout(watchdog);
        turnstilePending = null;
        resolve(token || '');
      };
    });
    turnstilePending = slot;
    if (typeof onWaiting === 'function') onWaiting();
    try {
      window.turnstile.reset(id);
      window.turnstile.execute(id);
    } catch (err) {
      slot.resolve('');
    }
    return slot.promise;
  }

  /* ---------- the vote request ---------- */

  function voteHeaders() {
    var headers = { 'Content-Type': 'application/json' };
    // The function is deployed with JWT verification left on, so the Supabase
    // gateway wants the project's PUBLIC anon key. It is public information: it is
    // already embedded in /js/supabase-client.js on this very site. It grants
    // nothing here; every write is done by the function under the service role key.
    if (config.anonKey) {
      headers.apikey = config.anonKey;
      headers.Authorization = 'Bearer ' + config.anonKey;
    }
    return headers;
  }

  function sendVote(body) {
    return fetch(config.voteBase + '/vote', {
      method: 'POST',
      headers: voteHeaders(),
      // Sends and accepts the wire_sess cookie. Requires the function to answer
      // with one exact origin plus Access-Control-Allow-Credentials: true.
      credentials: 'include',
      body: JSON.stringify(body)
    });
  }

  /**
   * POST to the vote Edge Function. Resolves with the server counts, rejects on non-2xx.
   * Attaches a Turnstile token on the first vote of a session, and once more if the
   * server rejects a session it thought it had.
   */
  function postVote(body, onStatus) {
    if (!config.voteBase) return Promise.reject(new Error('no vote endpoint configured'));
    var say = typeof onStatus === 'function' ? onStatus : function () {};

    function attempt(withToken) {
      var prepared = withToken
        ? turnstileToken(function () { say('challenge'); }).then(function (token) {
          say('sending');
          if (!token) return body;
          var copy = {};
          Object.keys(body).forEach(function (k) { copy[k] = body[k]; });
          copy.turnstile_token = token;
          return copy;
        })
        : Promise.resolve(body);

      if (!withToken) say('sending');
      return prepared.then(sendVote).then(function (res) {
        if (res.status === 403 && !withToken) {
          // The cookie the page thought it had is not accepted. Try once, with proof.
          markSession(false);
          return attempt(true);
        }
        if (!res.ok) throw new Error('vote ' + res.status);
        say('');
        if (withToken) markSession(true);
        return res.json().catch(function () {
          return {};
        });
      });
    }

    return attempt(!sessionHint());
  }

  /* ---------- rendering ---------- */

  /** The live tier, so an optimistic vote reorders the board before the server answers. */
  function tierOf(story) {
    return Math.sign(num(story.ups) - num(story.downs));
  }

  function ordered() {
    var list = state.stories.slice();
    if (state.tab === 'latest') {
      list.sort(function (a, b) {
        return Date.parse(b.published_at) - Date.parse(a.published_at);
      });
    } else {
      /*
       * Tier first, then hot. A story anyone has upvoted sits above every unvoted story no
       * matter how fresh; a downvoted one sits below every unvoted story and is still on the
       * page. Sorting by hot alone hid the effect of a first vote entirely, because log10(1)
       * is zero. Negative scores sink here; they are never removed from the list.
       */
      list.sort(function (a, b) {
        var ta = tierOf(a), tb = tierOf(b);
        if (ta !== tb) return tb - ta;
        return b.hot - a.hot;
      });
    }
    return list;
  }

  function arrowSvg(direction) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('width', '22');
    svg.setAttribute('height', '22');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', direction === 'up'
      ? 'M10 3.2 18 12h-4.6v4.8H6.6V12H2z'
      : 'M10 16.8 2 8h4.6V3.2h6.8V8H18z');
    path.setAttribute('fill', 'currentColor');
    svg.appendChild(path);
    return svg;
  }

  /*
   * The zero state, C12 as amended.
   *
   * A cold-start board used to print 140 literal zeros: twenty scores and a hundred
   * and twenty chip counts, seven of them on the only card a phone shows on its
   * first screen. A stranger arriving on a wall of zeros does not read "nobody has
   * voted yet", they read "voting here does nothing".
   *
   * So a rail with no votes behind it shows a neutral mark instead of a numeral,
   * and a chip with no reactions shows no count at all. This is PRESENTATION ONLY.
   * The data is untouched: ups, downs and reaction_counts are still zero, no vote
   * is invented, and the moment one real vote lands the numeral appears.
   *
   * The test is "has anybody voted", not "is the score zero". A story sitting at
   * five up and five down has been voted on and shows its honest 0.
   */
  var NO_VOTES_MARK = '\u00b7';

  function hasAnyVote(story) {
    return (num(story.ups) + num(story.downs)) > 0;
  }

  function paintRail(card, story) {
    var mine = num(state.myVotes[story.id]);
    var score = num(story.ups) - num(story.downs);
    var voted = hasAnyVote(story);
    card.classList.toggle('is-upvoted', mine === 1);
    card.classList.toggle('is-downvoted', mine === -1);
    card.classList.toggle('is-unvoted', !voted);
    var scoreNode = card.querySelector('.wire-score');
    scoreNode.textContent = voted ? String(score) : NO_VOTES_MARK;
    scoreNode.setAttribute('aria-label', voted
      ? 'Score ' + score
      : 'No votes yet. Be the first.');
    scoreNode.title = voted ? '' : 'No votes yet';
    scoreNode.classList.toggle('is-nothing-yet', !voted);
    scoreNode.classList.toggle('is-negative', voted && score < 0);
    var up = card.querySelector('.wire-arrow--up');
    var down = card.querySelector('.wire-arrow--down');
    up.setAttribute('aria-pressed', mine === 1 ? 'true' : 'false');
    down.setAttribute('aria-pressed', mine === -1 ? 'true' : 'false');
  }

  function paintReactions(card, story) {
    var counts = story.reaction_counts;
    REACTIONS.forEach(function (r) {
      var chip = card.querySelector('.wire-chip[data-kind="' + r.kind + '"]');
      if (!chip) return;
      // A chip nobody has pressed carries no number. Zero is not information here.
      var n = num(counts[r.kind]);
      var countNode = chip.querySelector('.wire-chip-count');
      countNode.textContent = n > 0 ? String(n) : '';
      countNode.hidden = n === 0;
      var held = !!(state.myReactions[story.id] && state.myReactions[story.id][r.kind]);
      chip.classList.toggle('is-held', held);
      chip.setAttribute('aria-pressed', held ? 'true' : 'false');
    });
    var badge = card.querySelector('.wire-contested');
    badge.hidden = !isContested(counts);
  }

  /** 01, 02, 03: a ranked board should say what rank each thing is. */
  function rankLabel(i) {
    return (i + 1) < 10 ? '0' + (i + 1) : String(i + 1);
  }

  function buildCard(story, index) {
    var card = el('article', 'wire-card');
    card.dataset.storyId = story.id;

    /* The drafting ordinal, appended FIRST so no insertBefore is needed: the harness DOM
       implements appendChild and not the insert family, and a decorative flourish is not
       worth a test-infrastructure change. */
    var rank = el('span', 'wire-rank', rankLabel(typeof index === 'number' ? index : 0));
    rank.setAttribute('aria-hidden', 'true');
    card.appendChild(rank);

    /* left rail: up arrow, score, down arrow */
    var rail = el('div', 'wire-rail');
    var up = el('button', 'wire-arrow wire-arrow--up');
    up.type = 'button';
    up.setAttribute('aria-label', 'Upvote: ' + story.headline);
    up.appendChild(arrowSvg('up'));
    var score = el('span', 'wire-score', NO_VOTES_MARK);
    var down = el('button', 'wire-arrow wire-arrow--down');
    down.type = 'button';
    down.setAttribute('aria-label', 'Downvote: ' + story.headline);
    down.appendChild(arrowSvg('down'));
    rail.appendChild(up);
    rail.appendChild(score);
    rail.appendChild(down);
    card.appendChild(rail);

    /* right: headline, domain, meta, sources, reactions */
    var body = el('div', 'wire-body');

    var h2 = el('h2', 'wire-headline');
    var link = el('a', 'wire-link', story.headline);
    var safeStoryUrl = safeHttpUrl(story.url);
    if (safeStoryUrl) {
      link.href = safeStoryUrl;
    } else {
      // No link at all beats a link that can run script.
      link.removeAttribute('href');
      link.setAttribute('aria-disabled', 'true');
    }
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    h2.appendChild(link);
    /*
     * The publisher, as the transform worked it out.
     *
     * lib/story-rows.mjs answers 'unknown' when the only link a story has is a
     * redirect wrapper (news.google.com, a newsletter click tracker) or this
     * wire's own permalink, because naming whoever was standing nearest is how
     * eight of twenty cards ended up attributed to something that never published
     * them, four of those to victordelrosal.com. A reader should see that honestly
     * and in words, not as a domain called "unknown" that looks like a bug.
     */
    if (story.domain === 'unknown') {
      h2.appendChild(el('span', 'wire-domain wire-domain--unknown', 'publisher unknown'));
    } else if (story.domain) {
      h2.appendChild(el('span', 'wire-domain', story.domain));
    }
    body.appendChild(h2);

    if (story.summary) body.appendChild(el('p', 'wire-summary', story.summary));

    var meta = el('p', 'wire-meta');
    /*
     * A story whose only carrier gave no usable link has no source rows, and the first
     * production data proved that is 2 of every 10 stories, not a rare edge. Rendering
     * "0 sources" next to a dotted underline that expands to nothing is a defect on a
     * board whose whole pitch is honest attribution. Say what is true instead: the
     * source is not recorded, and offer nothing to expand.
     */
    if (num(story.source_count) > 0) {
      var sourcesBtn = el('button', 'wire-sources-toggle',
        story.source_count + (story.source_count === 1 ? ' source' : ' sources'));
      sourcesBtn.type = 'button';
      sourcesBtn.setAttribute('aria-expanded', 'false');
      meta.appendChild(sourcesBtn);
    } else {
      meta.appendChild(el('span', 'wire-nosource', 'source not recorded'));
    }
    // A middle dot, not a full stop: "3 sources . 1h" reads as a typo mid-sentence.
    meta.appendChild(el('span', 'wire-sep', '\u00b7'));
    var dateNode = el('span', 'wire-date', dateLabel(story.published_at));
    dateNode.title = fullDateLabel(story.published_at);
    meta.appendChild(dateNode);
    meta.appendChild(el('span', 'wire-sep', '\u00b7'));
    meta.appendChild(el('span', 'wire-age', ageLabel(story.published_at)));
    var badge = el('span', 'wire-contested', 'Contested');
    badge.hidden = true;
    meta.appendChild(badge);
    body.appendChild(meta);

    var sourceList = el('ul', 'wire-sources');
    sourceList.hidden = true;
    body.appendChild(sourceList);

    var chips = el('div', 'wire-reactions');
    REACTIONS.forEach(function (r) {
      var chip = el('button', 'wire-chip');
      chip.type = 'button';
      chip.dataset.kind = r.kind;
      // data-label feeds the styled tooltip in wire.css. The native title attribute is
      // deliberately NOT set: a browser would then draw its own slow tooltip on top of ours.
      chip.dataset.label = r.label;
      chip.setAttribute('aria-label', r.label);
      chip.setAttribute('aria-pressed', 'false');
      chip.appendChild(el('span', 'wire-chip-glyph', r.glyph));
      // The word is deliberately not rendered: Victor asked for the emoji alone.
      // It still reaches a hover tooltip and a screen reader through title and
      // aria-label set above, so the meaning is available without the clutter.
      var chipCount = el('span', 'wire-chip-count', '');
      chipCount.hidden = true;
      chip.appendChild(chipCount);
      chips.appendChild(chip);
    });
    body.appendChild(chips);

    var note = el('p', 'wire-card-note');
    note.hidden = true;
    body.appendChild(note);

    card.appendChild(body);

    paintRail(card, story);
    paintReactions(card, story);
    return card;
  }

  var invite = document.getElementById('wire-invite');

  /*
   * FLIP across a full rebuild. render() replaces every node, so the classic technique of
   * animating the SAME element does not apply: instead we remember where each story id sat,
   * rebuild, then start each surviving card at its old offset and let it travel to the new one.
   *
   * This exists because upvoting now lifts a story above every unvoted one. Without it the card
   * the reader just clicked teleports across the screen, and the single moment the interface most
   * needs to be legible is the moment it explains itself least.
   */
  function capturePositions() {
    var map = {};
    var cards = board.querySelectorAll('.wire-card');
    for (var i = 0; i < cards.length; i++) {
      // FLIP is a layout effect. Anywhere without layout (a test harness, a server render)
      // there is nothing to measure and nothing to animate, so skip rather than throw.
      if (typeof cards[i].getBoundingClientRect !== 'function') return null;
      map[cards[i].dataset.storyId] = cards[i].getBoundingClientRect().top;
    }
    return map;
  }

  function playMovement(before) {
    if (!before) return;
    var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    var cards = board.querySelectorAll('.wire-card');
    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var was = before[card.dataset.storyId];
      if (was === undefined) continue;
      if (typeof card.getBoundingClientRect !== 'function') continue;
      var delta = was - card.getBoundingClientRect().top;
      if (Math.abs(delta) < 2) continue;          // it did not really move
      card.style.transform = 'translateY(' + delta + 'px)';
      card.classList.add('is-moving', 'is-lifted');
      /* jshint loopfunc:true */
      (function (node) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            node.style.transform = '';
            setTimeout(function () {
              node.classList.remove('is-moving', 'is-lifted');
              node.style.willChange = '';
            }, 460);
          });
        });
      })(card);
    }
  }

  /**
   * Reorder the EXISTING cards instead of rebuilding them.
   *
   * A full render() on every vote replaces all twenty nodes, which throws away the keyboard
   * focus sitting on the arrow the reader just pressed and invalidates every handle anything
   * else is holding. Moving the nodes keeps identity, keeps focus, and makes the FLIP the
   * classic same-element technique rather than a reconstruction.
   */
  /**
   * The titleblock, borrowed from the drafting sheets in sBs/VFX: a strip of real counts under
   * the header, mono and letterspaced over tabular figures. It tells a first-time reader what
   * this board actually is (how much it holds, how much has been said about it) in one line.
   */
  function paintTitleblock(list) {
    var block = document.getElementById('wire-titleblock');
    if (!block) return;
    var votes = 0, sources = 0, reactions = 0;
    for (var i = 0; i < list.length; i++) {
      votes += num(list[i].ups) + num(list[i].downs);
      sources += num(list[i].source_count);
      var rc = reactionCounts(list[i]);
      for (var k in rc) if (Object.prototype.hasOwnProperty.call(rc, k)) reactions += num(rc[k]);
    }
    var newest = list.reduce(function (acc, s) {
      var ts = Date.parse(s.published_at);
      return Number.isFinite(ts) && ts > acc ? ts : acc;
    }, 0);
    setCell(block, 'stories', list.length);
    setCell(block, 'sources', sources);
    setCell(block, 'votes', votes);
    setCell(block, 'reactions', reactions);
    setCell(block, 'scanned', newest ? ageLabel(new Date(newest).toISOString()) : '');
    block.hidden = false;
  }

  function setCell(block, name, value) {
    var node = block.querySelector('[data-cell="' + name + '"] .wire-cell-value');
    if (node) node.textContent = String(value);
  }

  function reorderBoard() {
    var before = capturePositions();
    var list = ordered();
    /*
     * Re-inserting a focused element blurs it, so a keyboard user who presses Enter on an
     * arrow is dropped back to the body and loses their place entirely. Remember what had
     * focus and put it back. preventScroll keeps the page still: the card is already
     * travelling, and a scroll jump on top of that is disorienting.
     */
    var focused = document.activeElement;
    for (var i = 0; i < list.length; i++) {
      var node = cardFor(list[i].id);
      if (node) board.appendChild(node);      // appendChild MOVES an existing node
    }
    if (focused && focused !== document.body && board.contains(focused)) {
      try { focused.focus({ preventScroll: true }); } catch (err) { focused.focus(); }
    }
    playMovement(before);
  }

  function render() {
    var before = capturePositions();
    board.textContent = '';
    var list = ordered();
    /*
     * The invitation. Shown only while NOT ONE story on the board carries a vote,
     * which is the honest reading of "cold start". It disappears the moment any
     * real vote exists. Nothing is inserted into the data to make it appear or
     * disappear; it is derived from ups and downs as they arrive.
     */
    if (invite) invite.hidden = list.length === 0 || list.some(hasAnyVote);
    if (!list.length) {
      status.textContent = 'No stories on the wire yet. The next scan fills this board.';
      status.hidden = false;
      return;
    }
    status.hidden = true;
    paintTitleblock(list);
    var frag = document.createDocumentFragment();
    list.forEach(function (story, i) {
      frag.appendChild(buildCard(story, i));
    });
    board.appendChild(frag);
    playMovement(before);
  }

  function cardFor(id) {
    return board.querySelector('.wire-card[data-story-id="' + id + '"]');
  }

  function note(card, message, tone) {
    if (!card) return;
    var node = card.querySelector('.wire-card-note');
    node.textContent = message;
    node.hidden = !message;
    node.classList.toggle('is-working', tone === 'working');
  }

  /* Turns postVote's status into the line the reader sees on the card. */
  function voteStatus(card) {
    return function (phase) {
      if (phase === 'challenge') {
        note(card, 'Checking you are human.', 'working');
      } else if (phase === 'sending') {
        note(card, 'Sending your vote.', 'working');
      } else {
        note(card, '');
      }
    };
  }

  /* ---------- interaction ---------- */

  function castArrow(story, direction) {
    var card = cardFor(story.id);
    var previous = num(state.myVotes[story.id]);
    var next = previous === direction ? 0 : direction;
    var snapshot = { ups: story.ups, downs: story.downs, mine: previous };

    // optimistic
    if (previous === 1) story.ups -= 1;
    if (previous === -1) story.downs -= 1;
    if (next === 1) story.ups += 1;
    if (next === -1) story.downs += 1;
    state.myVotes[story.id] = next;
    if (next === 0) delete state.myVotes[story.id];
    writeStore('wire.votes', state.myVotes);
    story.hot = hotOf(story);
    paintRail(card, story);
    note(card, '');
    /*
     * Re-sort now, not on the next reload. Voted stories rank above unvoted ones, so a vote
     * changes the order, and a change of order the reader never sees is a change that did not
     * happen as far as they are concerned. render() runs the FLIP, so the card travels rather
     * than teleporting. Only the Hot tab reorders: Latest is chronological and must not jump.
     */
    if (state.tab === 'hot') reorderBoard();

    return postVote({
      story_id: story.id,
      kind: 'arrow',
      value: next,
      voter_uuid: state.voterUuid
    }, voteStatus(card)).then(function (result) {
      if (result && Number.isFinite(Number(result.ups))) story.ups = num(result.ups);
      if (result && Number.isFinite(Number(result.downs))) story.downs = num(result.downs);
      story.hot = hotOf(story);
      // The server's counts can differ from the optimistic guess (someone else voted), so the
      // order is settled against the server, not against what this browser assumed.
      paintRail(cardFor(story.id), story);
      if (state.tab === 'hot') reorderBoard();
      note(cardFor(story.id), '');
    }).catch(function () {
      // rollback: the server refused, so the board goes back to what it knew
      story.ups = snapshot.ups;
      story.downs = snapshot.downs;
      if (snapshot.mine === 0) {
        delete state.myVotes[story.id];
      } else {
        state.myVotes[story.id] = snapshot.mine;
      }
      writeStore('wire.votes', state.myVotes);
      story.hot = hotOf(story);
      paintRail(card, story);
      note(card, 'Vote did not stick. Try again in a moment.');
    });
  }

  function castReaction(story, kind) {
    var card = cardFor(story.id);
    var held = state.myReactions[story.id] || {};
    var wasHeld = !!held[kind];
    var snapshot = num(story.reaction_counts[kind]);

    // optimistic
    story.reaction_counts[kind] = Math.max(0, snapshot + (wasHeld ? -1 : 1));
    if (wasHeld) {
      delete held[kind];
    } else {
      held[kind] = true;
    }
    state.myReactions[story.id] = held;
    writeStore('wire.reactions', state.myReactions);
    paintReactions(card, story);
    note(card, '');

    return postVote({
      story_id: story.id,
      kind: 'reaction',
      reaction: kind,
      voter_uuid: state.voterUuid
    }, voteStatus(card)).then(function (result) {
      if (result && result.reaction_counts && typeof result.reaction_counts === 'object') {
        story.reaction_counts = reactionCounts(result);
      }
      paintReactions(card, story);
      note(card, '');
    }).catch(function () {
      story.reaction_counts[kind] = snapshot;
      if (wasHeld) {
        held[kind] = true;
      } else {
        delete held[kind];
      }
      state.myReactions[story.id] = held;
      writeStore('wire.reactions', state.myReactions);
      paintReactions(card, story);
      note(card, 'Reaction did not stick. Try again in a moment.');
    });
  }

  function toggleSources(story, button) {
    var card = cardFor(story.id);
    var list = card.querySelector('.wire-sources');
    var open = button.getAttribute('aria-expanded') === 'true';
    if (open) {
      list.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      return Promise.resolve();
    }
    button.setAttribute('aria-expanded', 'true');
    list.hidden = false;
    if (list.dataset.filled === '1') return Promise.resolve();
    return fetchSources(story).then(function (rows) {
      list.textContent = '';
      if (!rows || !rows.length) {
        list.appendChild(el('li', 'wire-source wire-source--empty', 'No source list recorded for this story.'));
      } else {
        rows.forEach(function (source) {
          var li = el('li', 'wire-source');
          var a = el('a', 'wire-source-link', source.name || source.domain || source.url);
          var safeSourceUrl = safeHttpUrl(source.url);
          if (safeSourceUrl) {
            a.href = safeSourceUrl;
          } else {
            a.removeAttribute('href');
            a.setAttribute('aria-disabled', 'true');
          }
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          li.appendChild(a);
          li.appendChild(el('span', 'wire-source-domain', source.domain || ''));
          if (source.kind) li.appendChild(el('span', 'wire-source-kind', source.kind));
          list.appendChild(li);
        });
      }
      list.dataset.filled = '1';
    }).catch(function () {
      list.textContent = '';
      list.appendChild(el('li', 'wire-source wire-source--empty', 'Source list unavailable right now.'));
    });
  }

  board.addEventListener('click', function (event) {
    var card = event.target.closest ? event.target.closest('.wire-card') : null;
    if (!card) return;
    var story = state.byId[card.dataset.storyId];
    if (!story) return;

    var up = event.target.closest('.wire-arrow--up');
    if (up) {
      state.pending = castArrow(story, 1);
      return;
    }
    var down = event.target.closest('.wire-arrow--down');
    if (down) {
      state.pending = castArrow(story, -1);
      return;
    }
    var chip = event.target.closest('.wire-chip');
    if (chip) {
      state.pending = castReaction(story, chip.dataset.kind);
      return;
    }
    var sources = event.target.closest('.wire-sources-toggle');
    if (sources) {
      state.pending = toggleSources(story, sources);
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll('.wire-tab'), function (tab) {
    tab.addEventListener('click', function () {
      var next = tab.dataset.tab;
      if (next === state.tab) return;
      state.tab = next;
      Array.prototype.forEach.call(document.querySelectorAll('.wire-tab'), function (other) {
        var active = other.dataset.tab === next;
        other.classList.toggle('is-active', active);
        other.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      render();
    });
  });

  /* ---------- boot ---------- */

  fetchStories().then(function (stories) {
    state.stories = stories;
    state.byId = {};
    stories.forEach(function (story) {
      state.byId[story.id] = story;
    });
    render();
    document.body.dataset.wireReady = '1';
  }).catch(function () {
    status.textContent = 'The wire is unreachable right now. Refresh in a moment.';
    status.hidden = false;
    document.body.dataset.wireReady = 'error';
  });

  /*
   * Exposed for the render harness and for the end-to-end test (C16), which drives
   * these exact functions against the real vote handler. Production code never reads
   * this object; nothing here is a second implementation of anything above it.
   */
  window.WireBoard = {
    reactions: REACTIONS,
    hotOf: hotOf,
    state: state,
    config: config,
    isContested: isContested,
    minContestedReactions: MIN_CONTESTED_REACTIONS,
    postVote: postVote,
    castArrow: castArrow,
    castReaction: castReaction,
    render: render
  };
})();
