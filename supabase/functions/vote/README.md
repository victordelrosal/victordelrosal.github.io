# vote (Supabase Edge Function, Deno)

Accepts arrow votes and reactions for the ai-wire board. Built against CONTRACT.md
section "Vote endpoint"; the contract is frozen and this function does not deviate from it.

## Files

| File | What it holds |
| --- | --- |
| `index.ts` | The Edge Function shell: reads env, adapts the PostgREST client to the `VoteDb` interface, serves. No decision logic. `Deno.serve` runs only under `import.meta.main`, so tests can import and EXECUTE this file instead of reading it as text. |
| `handler.ts` | The boundary, and nothing else: CORS, the OPTIONS and 405 answers, one call to `intake()` and one to `handleIdentified()`. It is the only shipped module that holds a `Request` and is not the seal, which is why it is kept this short. Its catch around `intake()` takes **no** error binding: see C18 below. |
| `identity.ts` | THE SEAL. The only module in which a raw client IP, a raw browser uuid or a raw Turnstile token exists as a value: `clientIpFrom`, `computeVoterId`, `computeIpHash`, `verifyTurnstile`, `scrub` and `intake`. Everything it returns is hashed, scrubbed or closed over. Every line of its code is pinned by hash in `vote_test.ts`. |
| `crypto.ts` | `hmacHex`, `toHex`, `timingSafeEqual`. **Inside the trust boundary**: the seal imports it, so its `message` parameter is the raw IP on one call and the raw uuid on the next. Pinned and guarded on the same terms as `identity.ts`. Pure functions only, no module state. Imports nothing. |
| `lib.ts` | Everything downstream of the seal: validation, cap arithmetic, session signing, CORS helpers, `handleIdentified`. It receives hashes and a scrubbed body, never a raw value. The database client and `fetch` are injected. |
| `fake_supabase.ts` | An in-memory fake of the PostgREST client, modelling the four contract tables plus the trigger that derives `ups`, `downs`, `hot` and `reaction_counts`. Not a test file. |
| `dom_stub.ts` | A minimal DOM so the SHIPPED `web/js/wire.js` can be executed in a test. Generic DOM behaviour only. Not a test file. |
| `vote_test.ts` | 44 tests: the handler, the adapter, the caps, the session, CORS, the C18 structural guards, and the pin on the `bump_vote_rate` signature. |
| `e2e_test.ts` | 9 tests for C16: the real board code voting into the real handler over an in-memory database, plus six deliberate breakages that must go red. |
| `deno.json` | Enables the `raw-imports` unstable flag. The two test files use a raw text import of the shipped sources when it is available and fall back to `Deno.readTextFileSync` when it is not, because Deno discovers this config from the CURRENT WORKING DIRECTORY and C7's anchor grants no `--allow-read`. A copy sits at the ai-wire root for the same reason. See the `loadText` note at the top of `vote_test.ts`. |

## Request

```
POST /functions/v1/vote
Content-Type: application/json

{ "story_id": "<uuid>",
  "kind": "arrow",            // or "reaction"
  "value": 1,                 // arrow only: -1, 0 (undo) or 1
  "reaction": "useful",       // reaction only: like|love|useful|witty|doubt|laugh
  "voter_uuid": "<client-generated string>",
  "turnstile_token": "<cloudflare token>" }
```

The client IP is read from `x-forwarded-for`, first entry; an absent header is handled
(the literal `unknown` is hashed instead, so the rate row still exists).

### What the board must send, exactly

This is the contract between `web/js/wire.js` and this function. Every line of it is
asserted end to end by `e2e_test.ts`; changing either side alone turns that suite red.

| Part | Value | Why |
| --- | --- | --- |
| `Content-Type` | `application/json` | |
| `apikey` | the project's **public anon key** | The function is deployed with JWT verification left **on** (GATES.md, Gate 6), so the Supabase gateway rejects a request that carries no key before this code runs. |
| `Authorization` | `Bearer <the same public anon key>` | Same reason. The key is public information: it is already embedded in `/js/supabase-client.js` on the site. It grants nothing here; every write is done by this function under the service role key. |
| `credentials` | `"include"` on the fetch | The `wire_sess` cookie is `SameSite=None`, and the board and the function are on different origins. Without this the cookie never travels and every vote costs a fresh Turnstile challenge. |
| `turnstile_token` | present on the **first** vote of a session, absent afterwards | Contract rule 3. The board executes an invisible Turnstile widget on the first vote, sends the token, and rides the returned cookie after that. If this function answers 403 to a cookie-only vote, the board drops its session hint and retries once with a fresh token. |

The Turnstile **Site Key** lives in `web/wire/index.html` as `window.WIRE_TURNSTILE_SITE_KEY`.
It currently holds Cloudflare's documented always-passes test key
(`1x00000000000000000000AA`) so the page can be previewed before the real widget exists;
Gate 7 replaces it with the Site Key issued in Gate 2. The matching **Secret Key** never
leaves the function environment (`TURNSTILE_SECRET_KEY`).

### CORS: one exact origin, never a wildcard

Because the board votes with credentials, a browser refuses any reply that carries
`Access-Control-Allow-Origin: *`. Every reply from this function, including preflight,
403 and 500, therefore carries:

```
Access-Control-Allow-Origin: <the one requesting origin, if it is allowed>
Access-Control-Allow-Credentials: true
Vary: Origin
```

The allowlist defaults to `https://victordelrosal.com` and `https://www.victordelrosal.com`
and can be overridden with the `WIRE_ALLOWED_ORIGINS` function secret (comma separated,
exact origins, no trailing slash). An origin that is not on the list is answered with the
FIRST allowed origin, which never matches the requester, so the browser drops the reply.
`*` is never emitted by any code path, which `cors_never_answers_with_a_wildcard` asserts.

### Responses

| Status | When |
| --- | --- |
| 200 | Written. Body is exactly `{ ups, downs, hot, reaction_counts }`, read back after the write. |
| 400 | Malformed body: bad JSON, non-uuid story_id, unknown kind, arrow value outside -1/0/1, unknown reaction, missing voter_uuid. |
| 403 | Turnstile token missing, or siteverify rejected it, or the session cookie is invalid or expired. |
| 404 | story_id not present in scan_stories. |
| 405 | Anything other than POST or OPTIONS. |
| 429 | Cap exceeded: `code` is `vote_cap` (100 per ip_hash per hour) or `new_voter_cap` (40 distinct new voter ids per ip_hash per hour). |
| 500 | Server misconfigured, the database call failed, or the seal itself threw. The database failure logs the adapter's error message. The seal failure logs the bare constant `vote_intake_failed` and discards the error object entirely: an `Error` escaping `identity.ts` is the one object in this program able to carry a raw value out of it. |

## Order of operations

1. Validate the body shape. Nothing else runs on a malformed request.
2. Hash the identity: `voter_id = HMAC-SHA256(VOTER_SECRET, voter_uuid)`,
   `ip_hash = HMAC-SHA256(IP_SALT_SECRET || UTC date, ip)`. The raw uuid and the raw IP
   exist only as local variables from here on; neither is stored and neither is logged.
3. Turnstile, **before any database write**: a valid signed session cookie stands in for a
   fresh token for 24h; otherwise the token is required and is verified by a server-side POST
   to `https://challenges.cloudflare.com/turnstile/v0/siteverify`. On success a signed
   `wire_sess` cookie is set (HttpOnly, Secure, SameSite=None, 24h).
4. Story lookup: 404 if unknown.
5. Caps: `bump_vote_rate` adds this request to the ip_hash's hour bucket and returns the
   post-increment counts in one statement; those counts are compared to the caps, 429 if
   exceeded. The counter is bumped BEFORE the vote is written, so a refused request still
   counts as an attempt and leaves no vote behind it.
6. Write: arrow value 0 deletes the row, otherwise upsert on the PRIMARY KEY
   (story_id, voter_id); a reaction toggles on the PRIMARY KEY (story_id, voter_id, kind).
7. Read `scan_stories` back and return the fresh counts.

### Uniqueness is not the rate limiter

Vote uniqueness comes from `PRIMARY KEY (story_id, voter_id)` and nothing else: a repeat vote
is an upsert that flips `value` in place, so one voter always owns at most one row per story.
The caps in `applyCaps()` are abuse protection; they count requests per IP hash per hour and
never decide whether a vote is a duplicate. The separation is asserted by the test
`uniqueness_is_the_primary_key_not_the_rate_limiter`, which flips a vote twenty times and
checks that one row exists while the counter reads 20.

## The rate counter

The caps in CONTRACT.md rule 4 are counted by one SQL function, whose signature is FROZEN in
`migrations/0001_ai_wire.sql`:

```
public.bump_vote_rate(p_ip_hash text, p_is_new_voter boolean)
  RETURNS TABLE (votes int, new_voters int)
```

Two arguments, exactly those names. `index.ts` sends `{ p_ip_hash, p_is_new_voter }` and
nothing else. Three things follow from that and are worth stating plainly, because this seam
has already broken twice.

1. **The database owns the hour bucket.** It computes `date_trunc('hour', now())` itself, so
   no caller sends a `window_start`. There is deliberately no `hourBucket()` helper in
   `lib.ts` any more: a second implementation would be a second opinion about which hour a
   vote landed in, and the two would disagree the moment a request straddled the boundary.
2. **There is no separate read of the counter.** `VoteDb` has no `getRate()`. Reading the
   counter and then writing it is precisely the race the function exists to remove: two
   votes from one ip_hash read the same number, both write it plus one, and one vote
   vanishes from the count. The post-increment counts come back from the write itself, which
   is why `applyCaps()` compares with `>` rather than `>=`.
3. **There is no fallback.** An earlier version of this adapter dropped to a
   read-modify-write upsert whenever the RPC returned an error. That turned a wrong argument
   list into a silent degrade rather than a failure, and the degraded counter was measured
   losing 307 votes out of 400 under eight concurrent sessions from one ip_hash while the
   atomic function lost none. A rate limiter that quietly stops limiting is worse than one
   that stops working, so an error from this call now surfaces as a 500.

PostgREST resolves an RPC by argument NAME, so an extra key, a missing key or a renamed key
does not reach a slightly-wrong function; it reaches no function at all. The test
`bump_vote_rate_signature_is_pinned_to_the_migration` parses the argument names and the
returned columns out of `migrations/0001_ai_wire.sql` itself and compares them to what the
shipped adapter actually sends, so the two cannot drift apart in either direction without
something going red. It holds even if the in-memory fake is made permissive, because it reads
the migration rather than the fake.

## Environment variables

All read in `index.ts` at request time. A key is never accepted from the request.

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Project URL. Injected by the platform. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key. Anonymous clients never write via PostgREST; this function is the only writer. Injected by the platform. |
| `VOTER_SECRET` | HMAC key for voter_id. Rotating it resets every voter identity, so treat it as permanent. |
| `IP_SALT_SECRET` | HMAC key for ip_hash; the UTC date is appended, so yesterday's hashes cannot be correlated with today's. |
| `SESSION_SECRET` | HMAC key for the `wire_sess` cookie. Safe to rotate: it only forces a fresh Turnstile challenge. |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret for the site key used by /wire/. |

Set the four application secrets (the two SUPABASE_ ones are automatic):

```bash
supabase secrets set \
  VOTER_SECRET="$(openssl rand -hex 32)" \
  IP_SALT_SECRET="$(openssl rand -hex 32)" \
  SESSION_SECRET="$(openssl rand -hex 32)" \
  TURNSTILE_SECRET_KEY="<from the Cloudflare Turnstile dashboard>" \
  --project-ref <project-ref>
```

## Deploy

```bash
# from the repo root that holds supabase/functions/vote/
supabase functions deploy vote --project-ref <project-ref>
```

Deploy with JWT verification left **on**, which is the default, matching GATES.md Gate 6.
The board is anonymous, so it sends the project's public anon key as both `apikey` and
`Authorization: Bearer`, exactly as `/js/posts.js` already does for reads. That gateway
check is the outermost gate on a public write endpoint; Turnstile and the per IP hash caps
are the second and third. Do not pass `--no-verify-jwt`: it removes the outer gate, and the
board would then be sending a header nothing checks.

## Test

```bash
deno test --allow-env functions/vote/
```

53 tests (44 in `vote_test.ts`, 9 in `e2e_test.ts`), hermetic: `fetch` is a spy, the
database is an in-memory fake, and even the assertion helpers are local so nothing is pulled
over the wire at test time. That command is C7's frozen anchor and it grants no
`--allow-read`, which is why the suite loads the shipped sources through `loadText`.

Three of them are worth naming.

`nothing_raw_reaches_a_logging_sink_at_runtime` (and its index.ts twin) is the C9 guard.
It used to read this function's source as text and grep it for a fixed list of identifier
names next to a `console.` call, and a cold verifier walked past that three separate ways
while the suite stayed green, one of them a plain
`console.log("vote_debug", req.headers.get("x-forwarded-for"))` that mentions no name on
the list. The guard now replaces the console, drives every branch of the handler including
the 500 path, and inspects the ARGUMENTS that actually arrived, unwrapping strings,
template results, nested objects, `Error`s, `Headers` and `Request`s. If a raw IP or a raw
voter uuid reaches any logging sink by any route, it is captured and the test fails.

`C18_the_whole_seal_is_pinned` and the guards under it are the C18 answer. The pin hashes
the whole of `identity.ts` with comments stripped, so prose can be edited freely and one
character of code anywhere in the seal turns it red, executed or not.

**The trust boundary is derived, not declared.**
`C18_the_trust_boundary_is_derived_from_the_seal_not_declared_beside_it` walks the seal's
own import graph and fails if it reaches a module that is not guarded. That is what closes
the `crypto.ts` hole: whatever the seal imports is handed the raw values as arguments, so
it is part of the seal. `crypto.ts` is therefore pinned too
(`C18_the_seals_own_import_is_pinned`) and is scanned for output channels along with
`identity.ts`.

**Neither module may keep state.** `C18_no_module_inside_the_boundary_keeps_mutable_state`
refuses any module-scope `let` or `var` in the boundary, and
`C18_the_boundary_exports_capabilities_not_values` watches every exported binding at
runtime: each must be a function or an immutable primitive, and none may change value or
render a raw fragment after the whole request matrix has been served. A module-level
mutable binding was the mechanism of both round-4 leaks, `export let lastMessage` in
`crypto.ts` and `let stash` in `identity.ts`.

**Every behavioural guard drives every shape.** `SHAPES` is an arrow vote, an arrow undo,
each reaction kind turning on, each reaction kind turning off, a session-cookie request
with no token, and a Turnstile refusal.
`C18_the_seal_returns_nothing_that_can_reconstruct_a_raw_value` (the exact key set of
`IntakeResult`, plus a fragment scan of everything inside it),
`C18_an_error_escaping_the_seal_cannot_carry_a_raw_value` (which actually drives
`handler.ts`'s catch, previously reached by no test at all, with a battery of hostile
requests in both shapes) and `C18_the_seals_only_outward_channel_carries_no_raw_value`
(the URL, headers and body of every `fetch` the seal makes; a query string is a log sink
too) all run the full matrix. Round 4 drove `req(arrow(1))` and nothing else, which is
why a leak gated on `fields.kind === "reaction"` put a raw uuid in the siteverify query
string with the suite green.

Two shapes are NOT covered by these guards, and are named rather than left silent:
`OPTIONS` and non-`POST` requests never reach `intake()`, so `handler.ts` answering them
before the seal is called is the only thing standing behind them.

`c16_vote_completes_end_to_end` is the C16 guard. It boots `web/js/wire.js` itself against
a DOM, clicks the up arrow through the real delegated listener, and lets the request run
into `voteHandler` from `index.ts` and down through the real adapter into the in-memory
database, then asserts the card renders the counts that came back. The fetch between them
enforces the browser's own rules, so a wildcard CORS header or a dropped `credentials`
option fails the test rather than passing it.

## Type checking

```bash
deno check functions/vote/index.ts     # exit 0
deno check functions/vote/handler.ts   # exit 0
deno check functions/vote/lib.ts       # exit 0
deno check functions/vote/identity.ts  # exit 0
```

All pass. An earlier version of this file claimed `index.ts` could not be type-checked in
this run because doing so would pull supabase-js and the Deno std http server over the
network. That line was stale: the dependency is in `deno.lock` and resolves from the local
cache, so the check runs offline and passes. The std http `serve` import is gone as well;
the function uses the built-in `Deno.serve`, and it only calls it under `import.meta.main`.

## Not yet configured

Honest list of what this function assumes but does not itself create.

1. **The tables.** `scan_stories`, `story_votes`, `story_reactions` and `vote_rate` come from
   `migrations/0001_ai_wire.sql` (Builder A). Nothing here creates or alters schema.
2. **`bump_vote_rate`.** Now shipped by the migration, so this is no longer an assumption.
   See "The rate counter" below for the signature and for what happens when it is absent.
3. **A per-window voter set.** The frozen contract's `vote_rate` table stores a `new_voters`
   count but no voter list, so "is this voter new" is answered by "has this voter_id ever
   appeared in `story_votes` or `story_reactions`". That is global rather than per hour
   window, which makes the new-voter cap slightly stricter than a literal reading of the
   contract. Tightening it needs a table the contract does not define, so it was not invented
   here.
4. **Single-use tokens.** Contract rule 3 says a token is used once. Cloudflare enforces that
   at siteverify: a replayed token comes back `timeout-or-duplicate` and this function returns
   403. No local replay cache is kept.
5. **The real Turnstile keys.** The page holds Cloudflare's always-passes TEST site key and
   the function has no secret yet. Gate 2 issues both; Gate 3 sets `TURNSTILE_SECRET_KEY`
   and Gate 7 swaps the site key into `web/wire/index.html`. Until then the widget passes
   everyone, which is fine on a board with no traffic and not fine on a live one.
6. **`WIRE_ALLOWED_ORIGINS`.** Optional. Unset, the allowlist is the two victordelrosal.com
   origins compiled into `lib.ts`, which is correct for the launch. Set it only if the board
   is ever served from another origin, and set it to exact origins, never `*`.
