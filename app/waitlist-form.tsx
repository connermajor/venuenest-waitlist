"use client";

import { useState } from "react";

// Outcomes the API can report for a signup attempt.
type ApiStatus =
  | "created" // brand new signup
  | "already_confirmed" // on the list, confirmation already delivered
  | "already_unconfirmed" // on the list, confirmation re-sent just now
  | "already_invited"; // already invited off the list
type Status = "idle" | "loading" | ApiStatus | "error";

const SUPPORT_EMAIL = "support@venuenest-example.com";

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
      setStatus((json.status as ApiStatus) ?? "created");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (status !== "idle" && status !== "loading" && status !== "error") {
    return <ResultScreen status={status} position={position} />;
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

function SupportLine() {
  return (
    <>
      Still need help? Email{" "}
      <a
        href={`mailto:${SUPPORT_EMAIL}`}
        className="underline underline-offset-2 transition-colors hover:text-sage-deep"
      >
        {SUPPORT_EMAIL}
      </a>
      .
    </>
  );
}

// Renders the outcome of a signup attempt, tailored to which state the person
// landed in. Position is shown as a #N chip where it's meaningful.
function ResultScreen({ status, position }: { status: ApiStatus; position: number | null }) {
  const spot = position ? (
    <span className="font-mono text-sage-deep">#{position}</span>
  ) : null;

  const content: Record<ApiStatus, { badge: string; heading: string; body: React.ReactNode }> = {
    created: {
      badge: "You're in",
      heading: "You're on the list",
      body: spot ? (
        <>You&apos;re {spot} in line. We&apos;ve sent a confirmation to your inbox.</>
      ) : (
        <>We&apos;ve sent a confirmation to your inbox.</>
      ),
    },
    already_unconfirmed: {
      badge: "Confirmation re-sent",
      heading: "You're already on the list",
      body: (
        <>
          You&apos;re {spot ?? "already"} in line. It looked like your confirmation
          hadn&apos;t arrived, so we just re-sent it — check your inbox and spam.
        </>
      ),
    },
    already_confirmed: {
      badge: "Already on the list",
      heading: "You're already signed up",
      body: (
        <>
          You&apos;re {spot ?? "already"} in line and we&apos;ve already emailed your
          confirmation. Please check your inbox and spam. <SupportLine />
        </>
      ),
    },
    already_invited: {
      badge: "You're at the front",
      heading: "You've reached the front of the line",
      body: (
        <>
          Good news — a spot has already opened up for you and we&apos;ve emailed
          your next steps. Please check your inbox, or reach out. <SupportLine />
        </>
      ),
    },
  };

  const c = content[status];
  return (
    <div className="py-2" role="status" aria-live="polite">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-line bg-sage-tint px-2.5 py-1 text-xs font-medium text-sage-deep">
        <span className="h-1.5 w-1.5 rounded-full bg-sage-deep" />
        {c.badge}
      </span>
      <h2 className="mt-4 font-serif text-2xl text-ink">{c.heading}</h2>
      <p className="mt-2 leading-relaxed text-[#6e6e6e]">{c.body}</p>
    </div>
  );
}
