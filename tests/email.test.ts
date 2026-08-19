import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGINAL = { ...process.env };

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.restoreAllMocks();
});

describe("sendConfirmationEmail", () => {
  it("skips silently when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { sendConfirmationEmail } = await import("@/lib/email");
    await expect(
      sendConfirmationEmail({ to: "jane@example.com", position: 1 }),
    ).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("never throws into the request path when delivery fails", async () => {
    process.env.RESEND_API_KEY = "re_test_key";
    // Force the Resend client to reject; the signup must not blow up.
    vi.doMock("resend", () => ({
      Resend: class {
        emails = { send: () => Promise.reject(new Error("boom")) };
      },
    }));
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { sendConfirmationEmail } = await import("@/lib/email");
    await expect(
      sendConfirmationEmail({ to: "jane@example.com", name: "Jane", position: 3 }),
    ).resolves.toBeUndefined();
    expect(err).toHaveBeenCalled();
  });
});
