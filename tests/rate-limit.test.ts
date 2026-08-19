import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    const key = `k-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000)).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    const key = `k-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000);
    expect(rateLimit(key, 5, 60_000)).toBe(false);
  });

  it("keeps separate counters per key", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    for (let i = 0; i < 5; i++) rateLimit(a, 5, 60_000);
    // b is untouched, so its first hit is still allowed.
    expect(rateLimit(b, 5, 60_000)).toBe(true);
  });

  it("forgets hits older than the window", () => {
    const key = `k-${Math.random()}`;
    // A zero-length window means every prior hit is already stale.
    for (let i = 0; i < 10; i++) {
      expect(rateLimit(key, 1, 0)).toBe(true);
    }
  });
});
