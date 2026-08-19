import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { adminToken, isAuthed } from "@/lib/auth";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  process.env.ADMIN_PASSWORD = "hunter2";
  process.env.ADMIN_SECRET = "test-secret";
});

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("adminToken", () => {
  it("is deterministic for the same password + secret", () => {
    expect(adminToken()).toBe(adminToken());
  });

  it("changes when the password changes", () => {
    const a = adminToken();
    process.env.ADMIN_PASSWORD = "different";
    expect(adminToken()).not.toBe(a);
  });

  it("never contains the raw password", () => {
    expect(adminToken()).not.toContain("hunter2");
  });
});

describe("isAuthed", () => {
  it("accepts a cookie holding the correct token", () => {
    expect(isAuthed(adminToken())).toBe(true);
  });

  it("rejects a wrong cookie value", () => {
    expect(isAuthed("nope")).toBe(false);
  });

  it("rejects an undefined cookie", () => {
    expect(isAuthed(undefined)).toBe(false);
  });

  it("locks admin entirely when no password is configured", () => {
    delete process.env.ADMIN_PASSWORD;
    // Even a well-formed-looking token must fail when the door has no lock set.
    expect(isAuthed("anything")).toBe(false);
  });
});
