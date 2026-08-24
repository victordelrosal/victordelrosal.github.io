// THE SEALED INTAKE. C18.
//
// This is the ONLY module in the shipped vote endpoint in which a raw client IP
// or a raw browser uuid exists as a value. Nothing it returns carries either of
// them. Everything downstream (handler.ts, lib.ts, index.ts) receives hashes and
// a scrubbed body, so a log line inserted anywhere downstream has no raw value
// in scope to print: it is a TypeScript error, not a leak.
//
// WHY THIS SHAPE, AND NOT ANOTHER ROUND OF SINK BLOCKING.
//
// Round 2 guarded C9 by stubbing eight console methods at runtime and asserting
// that nothing raw arrived. A cold verifier walked past that five times with the
// suite green:
//
//   1. console.group("vote from", ip)                 a ninth console method
//   2. Deno.stderr.writeSync(...ip...)                not a console method at all
//   3. a leak inside the unexercised turnstile-unreachable catch branch
//   4. console.error("vote", ...String(ip).split(".")) the value in pieces
//   5. console.error("voter", uuid.slice(0,18), uuid.slice(18))  the same trick
//
// The lesson is that SINKS ARE UNBOUNDED. Any new global, any stream, any
// third-party module, any string slicing defeats a list of names. SOURCES are
// not: a raw client IP can enter this program through exactly one door, the
// x-forwarded-for header, and a raw browser uuid through exactly one, the JSON
// request body. Two doors. So the guard is on the doors, not on the exits.
//
// WHY THE PIN IS NOW OVER THE WHOLE MODULE, AND NOT OVER A REGION INSIDE IT.
//
// Round 3 bracketed the handful of lines that hold a raw value with RAW-REGION
// markers and pinned those. A cold verifier defeated that three more times, each
// time by working OUTSIDE the marked region while still inside this file:
//
//   a. computeIpHash takes the raw IP as its parameter and sat outside the
//      markers. `throw new Error(`bad remote address: ${ip}`)` sent the raw IP
//      to handler.ts, which logged err.message. Suite green.
//   b. rawUuid is declared inside the region but is block-scoped to intake(), so
//      it is still live at the return statement, which sat outside. Adding
//      `trace: rawUuid` to the returned object put a raw uuid on the wire.
//   c. scrub() is what actually delivers the seal's promise and sat outside the
//      markers. Renaming the two keys it strips handed every downstream consumer
//      the raw uuid and the raw Turnstile token in taken.body.
//
// The class is not "three unlucky functions". It is that a region marker inside
// a file is a boundary an editor can simply step over while the pin keeps
// reporting green. A raw value that is live anywhere in this file is reachable
// from everywhere in this file, so the unit that has to be pinned is the FILE.
//
// So: functions/vote/vote_test.ts hashes the whole of this module with comments
// stripped and whitespace normalized. Prose (including this block) can be edited
// freely. One character of CODE anywhere in here, executed or not, exported or
// not, turns C18_the_whole_seal_is_pinned red. There is no longer an inside and
// an outside.
//
// Three behavioural guards sit under the pin so that C18 does not rest on a
// single hash, and so that a re-pin done carelessly still cannot ship a leak:
//
//   * C18_the_seal_returns_nothing_that_can_reconstruct_a_raw_value walks the
//     real IntakeResult, pins its exact key set, and fails if the raw IP, the raw
//     uuid or the raw Turnstile token appears anywhere inside it. That is route b
//     and route c, caught by behaviour rather than by text.
//   * C18_an_error_escaping_the_seal_cannot_carry_a_raw_value drives the catch in
//     handler.ts, which no test previously reached, with an Error whose message is
//     the raw IP, and asserts nothing raw reaches any sink. That is route a.
//   * C18_the_seals_only_outward_channel_carries_no_raw_value audits every fetch
//     this module makes: URL, headers and body. verifyTurnstile is the one place
//     the seal talks to the outside world, and a query parameter reaches
//     Cloudflare's logs just as surely as console.error reaches Deno's.
//
// Two consequences worth stating plainly:
//
//   * verifyTurnstile no longer sends `remoteip` to Cloudflare. It is an OPTIONAL
//     field of the siteverify API and CONTRACT.md rule 3 does not ask for it.
//     Sending it meant the raw IP had to survive as a named value all the way to
//     the fetch call, which is precisely where leak 3 was inserted. The token is
//     still verified server side, before any write, exactly as the contract says.
//   * The Turnstile token is captured in a closure here and is never returned,
//     so downstream code cannot log it either.

import { hmacHex } from "./crypto.ts";

export const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export interface TurnstileOutcome {
  ok: boolean;
  reason?: string;
}

/** The hashed identity. This is all any downstream code is ever given. */
export interface Identity {
  /** HMAC-SHA256(VOTER_SECRET, voter_uuid), hex. */
  voterId: string;
  /** HMAC-SHA256(IP_SALT_SECRET || utc date, ip), hex. */
  ipHash: string;
}

/**
 * The Turnstile capability. When the request carried a token, `verify` is a
 * closure over that token; the token itself never leaves this module.
 */
export type Challenge =
  | { kind: "none" }
  | {
    kind: "token";
    verify(fetchImpl: typeof fetch, secret: string): Promise<TurnstileOutcome>;
  };

export type IntakeResult =
  | { ok: false; status: 400; error: string }
  | {
    ok: true;
    identity: Identity;
    /** The parsed body with voter_uuid and turnstile_token REMOVED. */
    body: unknown;
    challenge: Challenge;
    /** The wire_sess cookie value, if any. Not a raw identifier. */
    sessionCookie: string | undefined;
  };

export interface IntakeSecrets {
  voterSecret: string;
  ipSaltSecret: string;
}

export function utcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const name = part.slice(0, eq).trim();
    if (name) out[name] = part.slice(eq + 1).trim();
  }
  return out;
}

/** First entry of x-forwarded-for, or null when the header is absent or empty. */
export function clientIpFrom(headers: Headers): string | null {
  const raw = headers.get("x-forwarded-for");
  if (!raw) return null;
  const first = raw.split(",")[0].trim();
  return first.length > 0 ? first : null;
}

/** voter_id = HMAC-SHA256(VOTER_SECRET, voter_uuid), hex. */
export function computeVoterId(
  voterSecret: string,
  voterUuid: string,
): Promise<string> {
  return hmacHex(voterSecret, voterUuid);
}

/** ip_hash = HMAC-SHA256(IP_SALT_SECRET || current UTC date, ip), hex. */
export function computeIpHash(
  ipSaltSecret: string,
  ip: string,
  utcDate: string,
): Promise<string> {
  return hmacHex(`${ipSaltSecret}${utcDate}`, ip);
}

/**
 * Server-side Turnstile verification. Called BEFORE any database write; see
 * handleIdentified in lib.ts. No IP is sent: see the note at the top of this file.
 */
export async function verifyTurnstile(
  fetchImpl: typeof fetch,
  secret: string,
  token: string,
): Promise<TurnstileOutcome> {
  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);

  let res: Response;
  try {
    res = await fetchImpl(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch {
    return { ok: false, reason: "turnstile-unreachable" };
  }
  if (!res.ok) return { ok: false, reason: "turnstile-http-error" };

  let payload: { success?: boolean; "error-codes"?: string[] };
  try {
    payload = await res.json();
  } catch {
    return { ok: false, reason: "turnstile-bad-json" };
  }
  if (payload.success === true) return { ok: true };
  return {
    ok: false,
    reason: (payload["error-codes"] ?? ["invalid-input-response"]).join(","),
  };
}

/** Strip the two fields that carry raw values out of a parsed body. */
function scrub(parsed: unknown): unknown {
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return parsed;
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (k === "voter_uuid" || k === "turnstile_token") continue;
    out[k] = v;
  }
  return out;
}

/**
 * Read the request, hash the two raw identifiers, and hand back nothing that
 * could reconstruct them.
 *
 * Every line of code in this module is pinned by hash in vote_test.ts. Change any
 * of it and that test goes red on purpose, whether or not the line ever runs.
 */
export async function intake(
  req: Request,
  secrets: IntakeSecrets,
  now: Date,
): Promise<IntakeResult> {
    let parsed: unknown;
  try {
    parsed = await req.json();
  } catch {
    return { ok: false, status: 400, error: "malformed json" };
  }
  const fields = (parsed && typeof parsed === "object" && !Array.isArray(parsed))
    ? parsed as Record<string, unknown>
    : {};
  const rawUuid = typeof fields.voter_uuid === "string" ? fields.voter_uuid : "";
  const rawToken = typeof fields.turnstile_token === "string"
    ? fields.turnstile_token
    : "";
  if (fields.turnstile_token !== undefined && typeof fields.turnstile_token !== "string") {
    return { ok: false, status: 400, error: "turnstile_token must be a string" };
  }
  if (rawUuid.trim().length < 8) {
    return { ok: false, status: 400, error: "voter_uuid must be a non-trivial string" };
  }
  const identity: Identity = {
    voterId: await computeVoterId(secrets.voterSecret, rawUuid),
    ipHash: await computeIpHash(
      secrets.ipSaltSecret,
      clientIpFrom(req.headers) ?? "unknown",
      utcDateString(now),
    ),
  };
  const challenge: Challenge = rawToken.trim().length === 0
    ? { kind: "none" }
    : {
      kind: "token",
      verify: (fetchImpl: typeof fetch, secret: string) =>
        verifyTurnstile(fetchImpl, secret, rawToken),
    };
  const body = scrub(parsed);
  
  return {
    ok: true,
    identity,
    body,
    challenge,
    sessionCookie: parseCookies(req.headers.get("cookie"))["wire_sess"],
  };
}
