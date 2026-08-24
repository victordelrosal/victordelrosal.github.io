// ai-wire vote endpoint: pure, injectable core, SANITIZED.
//
// Everything here is testable without a network or a database: the database
// client and the fetch implementation are injected by the caller (index.ts in
// production, mocks in vote_test.ts).
//
// C18: THIS FILE CANNOT LEAK A RAW IP OR A RAW BROWSER UUID, because it cannot
// reach one. It never touches a Request. handleIdentified() below is handed an
// Identity that holds two hex hashes and a body whose voter_uuid and
// turnstile_token have already been removed by identity.ts. A log line inserted
// anywhere in this file has nothing raw in scope to print: `ip` and
// `voter_uuid` are not names that exist here, so the leaks a cold verifier
// inserted in round 2 are now TypeScript errors rather than privacy failures.
// See the long note at the top of identity.ts for why the guard is on the two
// SOURCES rather than on the unbounded list of sinks.
//
// Two things are deliberately kept separate in this file:
//   1. Vote UNIQUENESS, which is owned by the PRIMARY KEY (story_id, voter_id)
//      and is expressed here only as "upsert one row" / "delete one row".
//   2. Rate CAPS, which are abuse protection only and never decide whether a
//      vote is a duplicate. See applyCaps() and the comment above it.

import { hmacHex, timingSafeEqual } from "./crypto.ts";
import type { Challenge, Identity } from "./identity.ts";

export const REACTION_KINDS = [
  "like",
  "love",
  "useful",
  "witty",
  "doubt",
  "laugh",
] as const;

export type ReactionKind = (typeof REACTION_KINDS)[number];

/** Abuse caps per ip_hash per hour. Never a uniqueness mechanism. */
export const CAP_VOTES_PER_HOUR = 100;
export const CAP_NEW_VOTERS_PER_HOUR = 40;

export const SESSION_COOKIE = "wire_sess";
export const SESSION_TTL_SECONDS = 86400; // 24h, per contract rule 3

/**
 * CORS.
 *
 * The board sends its vote with `credentials: "include"`, because the session
 * cookie set after a Turnstile pass is what lets the second and later votes of a
 * visit skip the challenge. A browser refuses a credentialed cross-origin request
 * whenever the reply carries `Access-Control-Allow-Origin: *`, so the wildcard is
 * not an option here: the reply must echo one exact origin and must also carry
 * `Access-Control-Allow-Credentials: true`.
 *
 * The allowlist is the site, and nothing else, unless WIRE_ALLOWED_ORIGINS says
 * otherwise (comma separated, exact origins, no trailing slash). The local render
 * harness passes its own origin in that variable rather than being hard-coded here.
 */
export const DEFAULT_ALLOWED_ORIGINS: readonly string[] = [
  "https://victordelrosal.com",
  "https://www.victordelrosal.com",
];

export function allowedOriginsFrom(raw: string | undefined | null): string[] {
  const listed = (raw ?? "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter((o) => o.length > 0);
  return listed.length > 0 ? listed : [...DEFAULT_ALLOWED_ORIGINS];
}

/**
 * The exact origin to echo. An origin that is not on the list gets the first
 * allowed origin instead, which never matches the requester, so the browser
 * blocks the reply. Never `*`.
 */
export function resolveCorsOrigin(
  requestOrigin: string | null,
  allowed: readonly string[],
): string {
  const wanted = (requestOrigin ?? "").trim().replace(/\/+$/, "");
  if (wanted && allowed.includes(wanted)) return wanted;
  return allowed[0] ?? DEFAULT_ALLOWED_ORIGINS[0];
}

export function corsHeaders(
  requestOrigin: string | null,
  allowed: readonly string[] = DEFAULT_ALLOWED_ORIGINS,
): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveCorsOrigin(requestOrigin, allowed),
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/*
 * The SANITIZED body types. Note what is not here: voter_uuid and
 * turnstile_token. identity.ts strips both before this file ever sees a body,
 * which is why nothing downstream can log them.
 */
export interface ArrowBody {
  kind: "arrow";
  story_id: string;
  value: -1 | 0 | 1;
}

export interface ReactionBody {
  kind: "reaction";
  story_id: string;
  reaction: ReactionKind;
}

export type VoteBody = ArrowBody | ReactionBody;

export interface StoryCounts {
  ups: number;
  downs: number;
  hot: number;
  reaction_counts: Record<string, number>;
}

export interface RateRow {
  votes: number;
  new_voters: number;
}

/**
 * The database surface the handler needs. index.ts implements this over
 * supabase-js with the service role key; tests implement it in memory.
 * Write methods are the last five.
 */
export interface VoteDb {
  /** Returns the story id if it exists, else null. Read only. */
  getStoryId(storyId: string): Promise<string | null>;
  /** True when this voter_id has been seen before (any story, any kind). */
  isKnownVoter(voterId: string): Promise<boolean>;
  /** True when the voter already holds that reaction on that story. */
  hasReaction(key: {
    story_id: string;
    voter_id: string;
    kind: ReactionKind;
  }): Promise<boolean>;
  /** Fresh denormalized counts, read AFTER the write. */
  readCounts(storyId: string): Promise<StoryCounts>;

  // --- writes ---
  upsertVote(row: {
    story_id: string;
    voter_id: string;
    value: -1 | 1;
    ip_hash: string;
  }): Promise<void>;
  deleteVote(key: { story_id: string; voter_id: string }): Promise<void>;
  insertReaction(row: {
    story_id: string;
    voter_id: string;
    kind: ReactionKind;
  }): Promise<void>;
  deleteReaction(key: {
    story_id: string;
    voter_id: string;
    kind: ReactionKind;
  }): Promise<void>;
  /**
   * Adds this request to the ip_hash's current hour bucket and returns the
   * POST-INCREMENT counts, in one atomic statement.
   *
   * There is deliberately no separate "read the counter" method. A read followed
   * by a write is the race the counter exists to catch: two votes from one
   * ip_hash both read the same number and one of them vanishes from the count.
   * The hour bucket is chosen by the database from now(), not by this code, so
   * the caller cannot disagree with the database about which window a vote
   * landed in.
   *
   * Backed by migrations/0001_ai_wire.sql:
   *   public.bump_vote_rate(p_ip_hash text, p_is_new_voter boolean)
   *     RETURNS TABLE (votes int, new_voters int)
   */
  bumpRate(row: { ip_hash: string; is_new_voter: boolean }): Promise<RateRow>;
}

export interface Secrets {
  voterSecret: string;
  ipSaltSecret: string;
  sessionSecret: string;
  turnstileSecret: string;
}

export interface Deps {
  db: VoteDb;
  fetchImpl: typeof fetch;
  secrets: Secrets;
  /** Injectable clock; defaults to the real one. */
  now?: () => Date;
  /**
   * Exact origins allowed to send a credentialed vote. Defaults to the site.
   * index.ts fills this from WIRE_ALLOWED_ORIGINS.
   */
  allowedOrigins?: readonly string[];
}

// ---------------------------------------------------------------------------
// Hashing
//
// hmacHex / toHex / timingSafeEqual moved to crypto.ts: a generic primitive that
// does not know what it is hashing. computeVoterId and computeIpHash moved to
// identity.ts, because their arguments ARE the raw values and this file must not
// be able to name one. See C18.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Body validation
//
// clientIpFrom and parseCookies moved to identity.ts. They read the two headers
// that carry raw values, so they are behind the seal with everything else that
// can name one.
// ---------------------------------------------------------------------------

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-9a-f][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export type ValidationResult =
  | { ok: true; body: VoteBody }
  | { ok: false; error: string };

/**
 * Shape validation of the SCRUBBED body. Never touches the database, never
 * trusts a key, and never sees voter_uuid or turnstile_token: identity.ts has
 * already validated and removed both by the time this runs.
 */
export function validateBody(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, error: "body must be a JSON object" };
  }
  const o = raw as Record<string, unknown>;

  if (!isUuid(o.story_id)) {
    return { ok: false, error: "story_id must be a uuid" };
  }

  if (o.kind === "arrow") {
    if (o.value !== -1 && o.value !== 0 && o.value !== 1) {
      return { ok: false, error: "value must be -1, 0 or 1" };
    }
    return {
      ok: true,
      body: {
        kind: "arrow",
        story_id: o.story_id,
        value: o.value as -1 | 0 | 1,
      },
    };
  }

  if (o.kind === "reaction") {
    if (
      typeof o.reaction !== "string" ||
      !(REACTION_KINDS as readonly string[]).includes(o.reaction)
    ) {
      return {
        ok: false,
        error: `reaction must be one of ${REACTION_KINDS.join(", ")}`,
      };
    }
    return {
      ok: true,
      body: {
        kind: "reaction",
        story_id: o.story_id,
        reaction: o.reaction as ReactionKind,
      },
    };
  }

  return { ok: false, error: 'kind must be "arrow" or "reaction"' };
}

// ---------------------------------------------------------------------------
// Caps (abuse protection ONLY)
// ---------------------------------------------------------------------------

export type CapDecision =
  | { allowed: true }
  | { allowed: false; code: "vote_cap" | "new_voter_cap" };

/**
 * Cap arithmetic. This decides whether a request is ABUSIVE, never whether a
 * vote is a DUPLICATE: duplicates are resolved by the PRIMARY KEY
 * (story_id, voter_id) upsert in castArrow()/castReaction() below. A voter who
 * flips their arrow ten times still owns exactly one row; the caps merely stop
 * one IP from doing that ten thousand times an hour.
 *
 * `counts` are the POST-INCREMENT counts returned by bump_vote_rate, so this
 * request is already included in them. That is why the comparison is `>` and not
 * `>=`: with a cap of 100, requests 1 to 100 pass (counts.votes reaches 100) and
 * request 101 is refused (counts.votes reads 101). Identical outcomes to the old
 * read-then-compare, without the read.
 */
export function applyCaps(
  counts: RateRow,
  isNewVoter: boolean,
): CapDecision {
  if (counts.votes > CAP_VOTES_PER_HOUR) {
    return { allowed: false, code: "vote_cap" };
  }
  if (isNewVoter && counts.new_voters > CAP_NEW_VOTERS_PER_HOUR) {
    return { allowed: false, code: "new_voter_cap" };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Session cookie (set after a successful Turnstile verification)
// ---------------------------------------------------------------------------

export async function signSession(
  sessionSecret: string,
  voterId: string,
  expEpochSeconds: number,
): Promise<string> {
  const sig = await hmacHex(sessionSecret, `${voterId}.${expEpochSeconds}`);
  return `${expEpochSeconds}.${sig}`;
}

export async function verifySession(
  sessionSecret: string,
  voterId: string,
  cookieValue: string | undefined,
  now: Date,
): Promise<boolean> {
  if (!cookieValue) return false;
  const dot = cookieValue.indexOf(".");
  if (dot < 0) return false;
  const exp = Number(cookieValue.slice(0, dot));
  const sig = cookieValue.slice(dot + 1);
  if (!Number.isFinite(exp)) return false;
  if (exp * 1000 <= now.getTime()) return false;
  const expected = await hmacHex(sessionSecret, `${voterId}.${exp}`);
  return timingSafeEqual(sig, expected);
}

export function sessionCookieHeader(value: string): string {
  return `${SESSION_COOKIE}=${value}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`;
}

// ---------------------------------------------------------------------------
// Turnstile (contract rule 3)
//
// verifyTurnstile moved to identity.ts. It used to take the raw remote IP as an
// argument so it could send `remoteip` to siteverify, which is exactly where a
// cold verifier put a leak inside the unexercised turnstile-unreachable catch
// branch. remoteip is optional in Cloudflare's API and the contract does not ask
// for it, so it is gone and the raw IP no longer travels that far. What arrives
// here instead is a Challenge: a closure that knows how to verify, holding the
// token where nothing downstream can read it.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Write paths. Uniqueness lives here, in the primary key.
// ---------------------------------------------------------------------------

/**
 * Arrow. value 0 deletes the row (undo); -1 or 1 upserts the single row
 * identified by the PRIMARY KEY (story_id, voter_id), which is what makes a
 * repeat vote a flip rather than a second vote.
 */
export async function castArrow(
  db: VoteDb,
  body: ArrowBody,
  voterId: string,
  ipHash: string,
): Promise<void> {
  if (body.value === 0) {
    await db.deleteVote({ story_id: body.story_id, voter_id: voterId });
    return;
  }
  await db.upsertVote({
    story_id: body.story_id,
    voter_id: voterId,
    value: body.value,
    ip_hash: ipHash,
  });
}

/**
 * Reaction. Additive across kinds, toggling within a kind; the PRIMARY KEY
 * (story_id, voter_id, kind) is again what guarantees at most one row.
 */
export async function castReaction(
  db: VoteDb,
  body: ReactionBody,
  voterId: string,
): Promise<"on" | "off"> {
  const held = await db.hasReaction({
    story_id: body.story_id,
    voter_id: voterId,
    kind: body.reaction,
  });
  if (held) {
    await db.deleteReaction({
      story_id: body.story_id,
      voter_id: voterId,
      kind: body.reaction,
    });
    return "off";
  }
  await db.insertReaction({
    story_id: body.story_id,
    voter_id: voterId,
    kind: body.reaction,
  });
  return "on";
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

function json(
  payload: unknown,
  status: number,
  cors: Record<string, string>,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...cors,
      "Content-Type": "application/json",
      ...extra,
    },
  });
}

/**
 * The sanitized handler. C18.
 *
 * Look at the parameters: there is no Request here. There is an Identity holding
 * two hex hashes, a Challenge holding a closure, and a body that identity.ts has
 * already stripped of voter_uuid and turnstile_token. Nothing in this function,
 * in any of its branches, including the catch, can name a raw client IP or a raw
 * browser uuid, because no such value was passed in.
 *
 * That is the whole point. In round 2 this logic lived in a function that held
 * the Request, so `ip` and `body.voter_uuid` were in scope on every line and the
 * only defence was watching the exits. A leak inserted here now fails to
 * compile.
 */
export async function handleIdentified(
  taken: {
    identity: Identity;
    body: unknown;
    challenge: Challenge;
    sessionCookie: string | undefined;
  },
  deps: Deps,
  cors: Record<string, string>,
  now: Date,
): Promise<Response> {
  try {
    // 1. Body shape. The scrubbed body, so story_id, kind, value, reaction.
    const parsed = validateBody(taken.body);
    if (!parsed.ok) return json({ error: parsed.error }, 400, cors);
    const body = parsed.body;

    const voterId = taken.identity.voterId;
    const ipHash = taken.identity.ipHash;

    // 2. Turnstile, BEFORE any write. A valid signed session cookie stands in
    //    for a fresh token for 24h; otherwise the token is required.
    const hasSession = await verifySession(
      deps.secrets.sessionSecret,
      voterId,
      taken.sessionCookie,
      now,
    );
    let setCookie: string | null = null;
    if (!hasSession) {
      if (taken.challenge.kind !== "token") {
        return json({ error: "turnstile token required" }, 403, cors);
      }
      const outcome = await taken.challenge.verify(
        deps.fetchImpl,
        deps.secrets.turnstileSecret,
      );
      if (!outcome.ok) {
        return json(
          { error: "turnstile verification failed", reason: outcome.reason },
          403,
          cors,
        );
      }
      const exp = Math.floor(now.getTime() / 1000) + SESSION_TTL_SECONDS;
      setCookie = sessionCookieHeader(
        await signSession(deps.secrets.sessionSecret, voterId, exp),
      );
    }

    // 3. Story must exist.
    const storyId = await deps.db.getStoryId(body.story_id);
    if (!storyId) return json({ error: "unknown story" }, 404, cors);

    // 4. Caps. Abuse protection only, never uniqueness.
    //
    //    One statement bumps the hour bucket and hands back the true
    //    post-increment counts, so two concurrent votes from the same ip_hash
    //    cannot both read the same stale number and lose one of themselves. The
    //    counter is bumped BEFORE the vote is written, which is what makes a
    //    refused request still count as an attempt: a 429 leaves the counter
    //    raised and no vote row behind it.
    const isNewVoter = !(await deps.db.isKnownVoter(voterId));
    const rate = await deps.db.bumpRate({
      ip_hash: ipHash,
      is_new_voter: isNewVoter,
    });
    const decision = applyCaps(rate, isNewVoter);
    if (!decision.allowed) {
      return json({ error: "rate limited", code: decision.code }, 429, cors);
    }

    // 5. Write.
    if (body.kind === "arrow") {
      await castArrow(deps.db, body, voterId, ipHash);
    } else {
      await castReaction(deps.db, body, voterId);
    }

    // 6. Fresh counts, read AFTER the write.
    const counts = await deps.db.readCounts(storyId);
    const extra: Record<string, string> = {};
    if (setCookie) extra["Set-Cookie"] = setCookie;
    return json(
      {
        ups: counts.ups,
        downs: counts.downs,
        hot: counts.hot,
        reaction_counts: counts.reaction_counts,
      },
      200,
      cors,
      extra,
    );
  } catch (err) {
    // Only the error message is logged, and there is nothing else available to
    // log even if someone tried: see the doc comment above.
    console.error("vote_failed", err instanceof Error ? err.message : "unknown");
    return json({ error: "internal error" }, 500, cors);
  }
}
