import { describe, it, expect } from "vitest";
import { signupSchema, slugSchema } from "@/lib/validation";

describe("signupSchema", () => {
  it("accepts a valid email", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com" });
    expect(r.success).toBe(true);
  });

  it("rejects a malformed email", () => {
    const r = signupSchema.safeParse({ email: "not-an-email" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toMatch(/valid email/i);
    }
  });

  it("lowercases and trims the email", () => {
    const r = signupSchema.safeParse({ email: "  JANE@Example.COM  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.email).toBe("jane@example.com");
  });

  it("treats name as optional", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBeUndefined();
  });

  it("accepts an empty-string name", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com", name: "" });
    expect(r.success).toBe(true);
  });

  it("rejects a name over 120 chars", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com", name: "x".repeat(121) });
    expect(r.success).toBe(false);
  });

  it("carries the honeypot field through untouched", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com", company: "bot corp" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.company).toBe("bot corp");
  });

  it("accepts an optional slug", () => {
    const r = signupSchema.safeParse({ email: "jane@example.com", slug: "garden-pavilion" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.slug).toBe("garden-pavilion");
  });
});

describe("slugSchema", () => {
  it("accepts a url-safe slug", () => {
    expect(slugSchema.safeParse("garden-pavilion").success).toBe(true);
  });

  it("lowercases the slug", () => {
    const r = slugSchema.safeParse("Garden-Pavilion");
    expect(r.success).toBe(true);
    if (r.success) expect(r.data).toBe("garden-pavilion");
  });

  it("rejects spaces and punctuation", () => {
    expect(slugSchema.safeParse("garden pavilion!").success).toBe(false);
  });

  it("rejects leading/trailing hyphens", () => {
    expect(slugSchema.safeParse("-garden-").success).toBe(false);
  });
});
