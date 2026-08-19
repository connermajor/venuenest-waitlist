# Decision Log

A short account of what I planned, what I shipped, where I got stuck, and what
I would do next. The goal was a clean, working core first, then bonus work on
top of that.

## Planned vs. shipped

**Planned (the core):** a signup form (name + email), Postgres storage, an
admin view of signups, a real Resend confirmation email, deployed to Vercel on
free tiers. All shipped and verified end to end.

**Shipped beyond the core:**

- **Waitlist position** returned on signup and shown in both the UI and the
  email; **idempotent** re-signups (a repeat email returns the same position,
  no error).
- **Simple admin auth** (bonus #1): password login that stores a *hashed* token
  in an httpOnly cookie, never the password itself.
- **Multi-tenancy** (bonus #2): a `Project` model with a `projectId` foreign key
  and a composite `@@unique([projectId, email])`, so the same email can be on
  different lists but not twice on one. The homepage `/` is the primary list;
  `/w/[slug]` renders any other list; the admin has per-project tabs, per-project
  CSV export, and a create-project form.
- **Resend webhooks** (bonus #3): I capture the Resend message id at send time,
  store it on the entry, and expose `/api/webhooks/resend` (Svix-signature
  verified) that reconciles `delivered` / `bounced` / `complained` / `opened`
  events back onto the row. The admin shows a live status badge per signup.
- **Better error + loading states** (bonus #4): the form has a loading state, an
  inline `role="alert"` error, live-announced success, and accessible inputs
  (`aria-invalid`, `aria-describedby`, labelled fields).
- **Real-world hardening** (bonus #5): a honeypot field and a per-IP rate limit
  to blunt bots, a `/api/health` DB check for uptime monitors, GitHub Actions CI
  (lint + typecheck + test + build), and 29 unit tests.

## Where I got stuck, and how I got unstuck

- **Migrating a live table to multi-tenancy without losing the 8 existing
  signups.** Adding a required `projectId` to a populated table fails. I did it
  in phases: added the FK as *nullable*, ran a backfill script that seeded a
  default `venuenest` project and attached every orphan row to it, confirmed
  zero orphans, then tightened the column to required and pushed again. No data
  loss.
- **Neon has two connection strings.** DDL (`prisma db push`) needs the
  non-pooling URL; the pooled pgbouncer URL is for the serverless request path.
  Using the pooled one for schema changes hangs. Split them explicitly.
- **Rate-limit test kept "failing" from one machine.** Vercel overwrites
  `x-forwarded-for` with the real client IP, so every local request counted as
  one IP. Once I understood that, I keyed the limiter on that header on purpose
  and set the test around the library default instead of the route's override.

## What I'd do with more time

- Swap the in-memory rate limiter for a durable store (Upstash/Redis) so it
  holds across serverless cold starts and instances.
- Add double opt-in (confirm-your-email) and an unsubscribe link, which a real
  waitlist needs for deliverability and compliance.
- Scope admin auth per-tenant (today one password sees all lists) and add an
  audit trail.
- Integration tests around the API route and webhook handler with a test
  database, not just unit tests on the pure functions.
