// The boundary. C18.
//
// This file is short on purpose. It is the only shipped module that holds a
// Request AND is not the sealed intake, so its entire job is:
//
//   method and origin  ->  CORS and the two non-POST answers
//   the Request        ->  handed straight to intake(), never read for anything
//                          that carries a raw value
//   the result         ->  handleIdentified(), which gets hashes only
//
// Note what is absent, and is asserted absent by
// no_shipped_module_outside_the_seal_can_reach_a_raw_value in vote_test.ts:
// x-forwarded-for, req.json(), voter_uuid, clientIpFrom, computeIpHash. Those
// are the ONLY doors a raw client IP or a raw browser uuid can come through, and
// they are all inside identity.ts. A leak inserted in this file therefore has
// nothing raw to reach for either.

import {
  corsHeaders,
  DEFAULT_ALLOWED_ORIGINS,
  type Deps,
  handleIdentified,
} from "./lib.ts";
import { intake } from "./identity.ts";

export async function handleVote(req: Request, deps: Deps): Promise<Response> {
  // One exact origin plus Allow-Credentials, never `*`: the board votes with
  // credentials: "include" so the session cookie can stand in for a fresh token.
  const cors = corsHeaders(
    req.headers.get("origin"),
    deps.allowedOrigins ?? DEFAULT_ALLOWED_ORIGINS,
  );

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const now = deps.now ? deps.now() : new Date();

  let taken;
  try {
    taken = await intake(req, deps.secrets, now);
  } catch {
    // THE ERROR OBJECT IS DISCARDED, DELIBERATELY, AND THERE IS NO BINDING FOR IT.
    //
    // intake() is the only code in this program that can hold a raw client IP or a
    // raw browser uuid, so an Error escaping it is the one object that can carry one
    // out of the seal. Its message, its name, its stack and its cause are all strings
    // an attacker inside identity.ts controls, and this catch is the first place they
    // become loggable. A previous version logged err.message here; a cold verifier put
    // `throw new Error(`bad remote address: ${ip}`)` in identity.ts and watched the raw
    // IP print from this line with the whole suite green.
    //
    // Writing `catch {}` with no parameter is not style: it makes the error
    // UNREACHABLE from this scope, so the leak cannot be re-introduced by editing the
    // console call. The constant below is the entire log line. C18, and
    // C18_an_error_escaping_the_seal_cannot_carry_a_raw_value asserts it by running
    // this branch with a raw IP inside the thrown message.
    console.error("vote_intake_failed");
    return new Response(JSON.stringify({ error: "internal error" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  if (!taken.ok) {
    return new Response(JSON.stringify({ error: taken.error }), {
      status: taken.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  return await handleIdentified(taken, deps, cors, now);
}
