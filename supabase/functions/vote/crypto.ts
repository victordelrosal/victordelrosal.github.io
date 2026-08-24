// Generic crypto primitives for the vote endpoint.
//
// THIS MODULE IS INSIDE THE TRUST BOUNDARY. It is imported by identity.ts, the
// sealed intake, which means `message` IS the raw client IP on one call and the raw
// browser uuid on the next. Being ignorant of what it is hashing does not put it
// outside the seal; it only means the raw value arrives here under a neutral name.
//
// An earlier version of this header argued the opposite: that ignorance let this file
// sit at the bottom of the graph "without widening the raw-value surface". A cold
// verifier took that argument apart in two lines, `export let lastMessage = ""` plus
// `lastMessage = message` inside hmacHex, then printed the raw client IP from lib.ts
// where console is perfectly legal. The suite reported 53 passed, 0 failed and
// identity.ts was byte-identical.
//
// So this file is pinned by hash (C18_the_seals_own_import_is_pinned), scanned for
// output channels alongside identity.ts, forbidden to hold module-scope mutable state
// (C18_no_module_inside_the_boundary_keeps_mutable_state) and watched at runtime for
// an export whose value moves (C18_the_boundary_exports_capabilities_not_values).
// Every function here must be pure and request scoped. It imports nothing.

const encoder = new TextEncoder();

export async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return toHex(new Uint8Array(sig));
}

export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

/** Constant-time-ish comparison for signatures. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
