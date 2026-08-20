"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "ok" | "already" | "error";

// `slug` scopes the signup to a specific waitlist (tenant). Omitted on the
// homepage, where the API defaults to the primary VenueNest list.
export default function WaitlistForm({ slug }: { slug?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState<number | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const form = e.currentTarget;
    const payload = {
      email: (form.elements.namedItem("email") as HTMLInputElement).value,
      name: (form.elements.namedItem("name") as HTMLInputElement).value,
      company: (form.elements.namedItem("company") as HTMLInputElement).value, // honeypot
      ...(slug ? { slug } : {}),
    };

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
        return;
      }
      setPosition(json.position ?? null);
      setStatus(json.status === "already" ? "already" : "ok");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status === "ok" || status === "already") {
    return (
      <div className="py-2" role="status" aria-live="polite">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-line bg-sage-tint px-2.5 py-1 text-xs font-medium text-sage-deep">
          <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
          {status === "already" ? "Already on the list" : "You're in"}
        </span>
        <h2 className="mt-4 font-serif text-2xl text-ink">
          {status === "already" ? "You were already signed up" : "You're on the list"}
        </h2>
        {position ? (
          <p className="mt-2 text-[#6e6e6e]">
            You&apos;re <span className="font-mono text-sage-deep">#{position}</span> in
            line. We sent a confirmation to your inbox.
          </p>
        ) : (
          <p className="mt-2 text-[#6e6e6e]">We sent a confirmation to your inbox.</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="John Doe"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "form-error" : undefined}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
        />
      </div>

      {/* Honeypot: hidden from humans, tempting to bots. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {status === "error" && (
        <p id="form-error" role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-md bg-forest px-4 py-2.5 font-medium text-white transition-colors hover:bg-forest-deep disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
