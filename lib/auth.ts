import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE = "vn_admin";

function secret(): string {
  return process.env.ADMIN_SECRET ?? "venuenest-dev-secret";
}

// Hash a value with the server secret. Used both for the cookie signature and
// for storing per-project admin passwords (so the raw password is never kept).
export function hashWithSecret(value: string): string {
  return createHash("sha256").update(`${value}:${secret()}`).digest("hex");
}

// A session is scoped. "owner" (the ADMIN_PASSWORD holder) sees every list; a
// project id scopes the session to just that one waitlist.
export const OWNER_SCOPE = "owner";

// The cookie is `<scope>.<signature>`, signed so a client can't forge or widen
// it. `scope` is "owner" or a project id (a url-safe cuid, no dots).
export function signScope(scope: string): string {
  return `${scope}.${hashWithSecret(`scope:${scope}`)}`;
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

// Returns the verified scope ("owner" or a project id) or null if the cookie is
// missing, malformed, or the signature doesn't check out.
export function verifyScope(cookieValue: string | undefined): string | null {
  if (!cookieValue) return null;
  const dot = cookieValue.lastIndexOf(".");
  if (dot < 1) return null;
  const scope = cookieValue.slice(0, dot);
  const sig = cookieValue.slice(dot + 1);
  if (!safeEqualHex(sig, hashWithSecret(`scope:${scope}`))) return null;
  // Owner access requires a password to actually be configured: no password
  // set means the owner door is locked, not open.
  if (scope === OWNER_SCOPE && !process.env.ADMIN_PASSWORD) return null;
  return scope;
}
