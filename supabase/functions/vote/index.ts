// ai-wire vote endpoint: Supabase Edge Function shell.
//
// This file does three things and nothing else: read the environment, adapt
// supabase-js to the VoteDb interface, and serve. All decision logic lives in
// lib.ts so it can be unit tested with no network and no database.
//
// The service role key is read from the function environment. A key is never
// accepted from the request.
//
// Nothing here runs at import time except definitions: `Deno.serve` is called
// only when this module is the program entry point (`import.meta.main`). That is
// what lets vote_test.ts and e2e_test.ts import this file and EXECUTE it, column
// names, onConflict targets, the single unconditional bump_vote_rate RPC and all,
// against an in-memory fake of the PostgREST client. Before that guard existed the
// whole file was covered only by reading it as text, which proved nothing.
//
// There is NO RPC-then-fallback path. bumpRate calls bump_vote_rate and lets an
// error surface as a 500; see the comment above it and index.ts's "No fallback,
// deliberately."

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  allowedOriginsFrom,
  corsHeaders,
  type Deps,
  type ReactionKind,
  type StoryCounts,
  type VoteDb,
} from "./lib.ts";
import { handleVote } from "./handler.ts";

// ---------------------------------------------------------------------------
// The slice of the PostgREST client this function actually uses.
//
// Declared structurally rather than imported as SupabaseClient so that a test
// can hand makeSupabaseDb() an in-memory fake and still exercise the real column
// names and the real conflict targets below.
// ---------------------------------------------------------------------------

export interface PgResult<T> {
  data: T | null;
  error: { message: string } | null;
}

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

export interface PgFilter extends PromiseLike<PgResult<Row[]>> {
  eq(column: string, value: unknown): PgFilter;
  limit(n: number): PgFilter;
  maybeSingle(): Promise<PgResult<Row>>;
  single(): Promise<PgResult<Row>>;
}

export interface PgTable {
  select(columns: string): PgFilter;
  upsert(
    values: Row,
    options?: { onConflict?: string; ignoreDuplicates?: boolean },
  ): PromiseLike<PgResult<Row[]>>;
  delete(): PgFilter;
}

export interface PgClient {
  from(table: string): PgTable;
  rpc(fn: string, args: Row): PromiseLike<PgResult<Row[]>>;
}

export function requireEnv(
  name: string,
  read: (n: string) => string | undefined = (n) => Deno.env.get(n),
): string {
  const v = read(name);
  if (!v) throw new Error(`missing required env var: ${name}`);
  return v;
}

export function makeSupabaseDb(client: PgClient): VoteDb {
  return {
    async getStoryId(storyId: string) {
      const { data, error } = await client
        .from("scan_stories")
        .select("id")
        .eq("id", storyId)
        .maybeSingle();
      if (error) throw new Error(`getStoryId: ${error.message}`);
      return data ? (data.id as string) : null;
    },

    // There is no getRate(). Reading the counter and then writing it is the race
    // bump_vote_rate exists to remove; the post-increment counts come back from
    // the write itself. See bumpRate below.

    async isKnownVoter(voterId: string) {
      const votes = await client
        .from("story_votes")
        .select("voter_id")
        .eq("voter_id", voterId)
        .limit(1);
      if (votes.error) throw new Error(`isKnownVoter: ${votes.error.message}`);
      if ((votes.data ?? []).length > 0) return true;

      const reactions = await client
        .from("story_reactions")
        .select("voter_id")
        .eq("voter_id", voterId)
        .limit(1);
      if (reactions.error) {
        throw new Error(`isKnownVoter: ${reactions.error.message}`);
      }
      return (reactions.data ?? []).length > 0;
    },

    async hasReaction(key) {
      const { data, error } = await client
        .from("story_reactions")
        .select("kind")
        .eq("story_id", key.story_id)
        .eq("voter_id", key.voter_id)
        .eq("kind", key.kind)
        .maybeSingle();
      if (error) throw new Error(`hasReaction: ${error.message}`);
      return data !== null;
    },

    async readCounts(storyId: string): Promise<StoryCounts> {
      const { data, error } = await client
        .from("scan_stories")
        .select("ups, downs, hot, reaction_counts")
        .eq("id", storyId)
        .single();
      if (error) throw new Error(`readCounts: ${error.message}`);
      return {
        ups: data?.ups ?? 0,
        downs: data?.downs ?? 0,
        hot: data?.hot ?? 0,
        reaction_counts: (data?.reaction_counts ?? {}) as Record<string, number>,
      };
    },

    // --- writes ---

    async upsertVote(row) {
      // One row per (story_id, voter_id): the PRIMARY KEY is the uniqueness
      // mechanism. A repeat vote flips value in place.
      const { error } = await client
        .from("story_votes")
        .upsert(
          {
            story_id: row.story_id,
            voter_id: row.voter_id,
            value: row.value,
            ip_hash: row.ip_hash,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "story_id,voter_id" },
        );
      if (error) throw new Error(`upsertVote: ${error.message}`);
    },

    async deleteVote(key) {
      const { error } = await client
        .from("story_votes")
        .delete()
        .eq("story_id", key.story_id)
        .eq("voter_id", key.voter_id);
      if (error) throw new Error(`deleteVote: ${error.message}`);
    },

    async insertReaction(row) {
      const { error } = await client
        .from("story_reactions")
        .upsert(
          {
            story_id: row.story_id,
            voter_id: row.voter_id,
            kind: row.kind as ReactionKind,
          },
          { onConflict: "story_id,voter_id,kind", ignoreDuplicates: true },
        );
      if (error) throw new Error(`insertReaction: ${error.message}`);
    },

    async deleteReaction(key) {
      const { error } = await client
        .from("story_reactions")
        .delete()
        .eq("story_id", key.story_id)
        .eq("voter_id", key.voter_id)
        .eq("kind", key.kind);
      if (error) throw new Error(`deleteReaction: ${error.message}`);
    },

    async bumpRate(row) {
      // THE FROZEN SIGNATURE, migrations/0001_ai_wire.sql:
      //
      //   public.bump_vote_rate(p_ip_hash text, p_is_new_voter boolean)
      //     RETURNS TABLE (votes int, new_voters int)
      //
      // Two arguments, named exactly this. PostgREST resolves an RPC by argument
      // NAME, so a third key, a missing key or a renamed key is not a slightly
      // wrong call: it is a different function, and the schema cache holds no
      // such overload. bump_vote_rate_signature_is_pinned_to_the_migration reads
      // the names straight out of the migration and asserts these two.
      //
      // The DATABASE picks the hour bucket, with date_trunc('hour', now()), and
      // increments by exactly one. Nothing here sends a window_start, a count or
      // an amount, because nothing here is entitled to an opinion about them.
      //
      // No fallback, deliberately. This adapter used to drop to a
      // read-modify-write upsert whenever the RPC returned an error, which meant
      // a wrong signature degraded SILENTLY into a lossy counter rather than
      // failing: measured at 307 votes lost out of 400 under eight concurrent
      // sessions from one ip_hash, while the atomic function lost none. A rate
      // limiter that quietly stops limiting is worse than one that stops working,
      // so an error here surfaces as a 500 and is visible.
      const { data, error } = await client.rpc("bump_vote_rate", {
        p_ip_hash: row.ip_hash,
        p_is_new_voter: row.is_new_voter,
      });
      if (error) throw new Error(`bumpRate: ${error.message}`);

      // RETURNS TABLE, so PostgREST hands back an array of rows.
      const first = Array.isArray(data) ? data[0] : data;
      if (
        !first || typeof first.votes !== "number" ||
        typeof first.new_voters !== "number"
      ) {
        throw new Error(
          "bumpRate: bump_vote_rate returned no post-increment counts",
        );
      }
      return { votes: first.votes, new_voters: first.new_voters };
    },
  };
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export interface Env {
  get(name: string): string | undefined;
}

export const denoEnv: Env = { get: (n) => Deno.env.get(n) };

/** Build the injected dependencies from the environment. Throws if misconfigured. */
export function buildDeps(
  env: Env = denoEnv,
  clientFactory?: (url: string, key: string) => PgClient,
): Deps {
  const read = (n: string) => env.get(n);
  const url = requireEnv("SUPABASE_URL", read);
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", read);
  const client = clientFactory
    ? clientFactory(url, serviceKey)
    : (createClient(url, serviceKey, {
      auth: { persistSession: false },
    }) as unknown as PgClient);

  return {
    db: makeSupabaseDb(client),
    fetchImpl: fetch,
    secrets: {
      voterSecret: requireEnv("VOTER_SECRET", read),
      ipSaltSecret: requireEnv("IP_SALT_SECRET", read),
      sessionSecret: requireEnv("SESSION_SECRET", read),
      turnstileSecret: requireEnv("TURNSTILE_SECRET_KEY", read),
    },
    allowedOrigins: allowedOriginsFrom(env.get("WIRE_ALLOWED_ORIGINS")),
  };
}

/**
 * The shipped request handler. Exported so a test can drive the exact code the
 * platform drives, rather than a copy of it.
 */
export async function voteHandler(
  req: Request,
  options: { env?: Env; clientFactory?: (url: string, key: string) => PgClient; deps?: Deps } = {},
): Promise<Response> {
  const env = options.env ?? denoEnv;
  const cors = corsHeaders(
    req.headers.get("origin"),
    allowedOriginsFrom(env.get("WIRE_ALLOWED_ORIGINS")),
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  let deps: Deps;
  try {
    deps = options.deps ?? buildDeps(env, options.clientFactory);
  } catch (err) {
    // Only the message. No request identifiers of any kind reach the log.
    console.error(
      "vote_misconfigured",
      err instanceof Error ? err.message : "unknown",
    );
    return new Response(JSON.stringify({ error: "server misconfigured" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return await handleVote(req, deps);
}

if (import.meta.main) {
  Deno.serve((req: Request) => voteHandler(req));
}
