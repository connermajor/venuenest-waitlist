import { createHash } from "crypto";

export const ADMIN_COOKIE = "vn_admin";

// The cookie stores a hash of the password + a server secret, never the
// password itself. Set ADMIN_PASSWORD (and ideally ADMIN_SECRET) in env.
export function adminToken(): string {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const secret = process.env.ADMIN_SECRET ?? "venuenest-dev-secret";
  return createHash("sha256").update(`${pw}:${secret}`).digest("hex");
}

export function isAuthed(cookieValue: string | undefined): boolean {
  // No password configured => admin is locked, not open.
  if (!process.env.ADMIN_PASSWORD) return false;
  return !!cookieValue && cookieValue === adminToken();
}
