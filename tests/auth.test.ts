import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { signScope, verifyScope, hashWithSecret, OWNER_SCOPE } from "@/lib/auth";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "hunter2";
  process.env.ADMIN_SECRET = "test-secret";
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("hashWithSecret", () => {
  it("is deterministic for the same value + secret", () => {
    expect(hashWithSecret("pw")).toBe(hashWithSecret("pw"));
  });

  it("changes when the secret changes", () => {
    const a = hashWithSecret("pw");
    process.env.ADMIN_SECRET = "other-secret";
    expect(hashWithSecret("pw")).not.toBe(a);
  });

  it("never contains the raw value", () => {
    expect(hashWithSecret("hunter2")).not.toContain("hunter2");
  });
});

describe("signScope / verifyScope", () => {
  it("round-trips the owner scope", () => {
    expect(verifyScope(signScope(OWNER_SCOPE))).toBe(OWNER_SCOPE);
  });

  it("round-trips a project scope (a cuid with no dots)", () => {
    const projectId = "ckxyz123abc456";
    expect(verifyScope(signScope(projectId))).toBe(projectId);
  });

  it("rejects an undefined cookie", () => {
    expect(verifyScope(undefined)).toBeNull();
  });

  it("rejects a cookie with no signature", () => {
    expect(verifyScope("owner")).toBeNull();
  });

  it("rejects a forged signature", () => {
    expect(verifyScope(`${OWNER_SCOPE}.deadbeef`)).toBeNull();
  });

  it("rejects a tampered scope (widening a project cookie to owner)", () => {
    // Take a validly-signed project cookie and swap the scope to "owner".
    const signed = signScope("ckxyz123abc456");
    const sig = signed.slice(signed.lastIndexOf(".") + 1);
    expect(verifyScope(`${OWNER_SCOPE}.${sig}`)).toBeNull();
  });

  it("is not fooled by a cookie signed under a different secret", () => {
    const forged = signScope(OWNER_SCOPE);
    process.env.ADMIN_SECRET = "attacker-secret";
    // Re-sign under the attacker's secret, then verify under ours.
    const attackerCookie = signScope(OWNER_SCOPE);
    process.env.ADMIN_SECRET = "test-secret";
    expect(verifyScope(attackerCookie)).toBeNull();
    // Sanity: the legitimately-signed one still verifies.
    expect(verifyScope(forged)).toBe(OWNER_SCOPE);
  });

  it("locks the owner door when no password is configured", () => {
    const cookie = signScope(OWNER_SCOPE);
    delete process.env.ADMIN_PASSWORD;
    // A validly-signed owner cookie must still fail when no owner password exists.
    expect(verifyScope(cookie)).toBeNull();
  });

  it("still honors a project scope when no owner password is configured", () => {
    const cookie = signScope("ckxyz123abc456");
    delete process.env.ADMIN_PASSWORD;
    expect(verifyScope(cookie)).toBe("ckxyz123abc456");
  });
});
