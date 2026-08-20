# VenueNest Waitlist

[![CI](https://github.com/connermajor/venuenest-waitlist/actions/workflows/ci.yml/badge.svg)](https://github.com/connermajor/venuenest-waitlist/actions/workflows/ci.yml)

A small, production-shaped waitlist tool: a signup form, Postgres storage, an
admin view, and a confirmation email on signup.

## Admin Access

- **Live app:** https://venuenest-waitlist-three.vercel.app
- **Admin view:** https://venuenest-waitlist-three.vercel.app/admin
- **Password:** `venue-05955c9d`

This is a demo instance, so the admin password is shared here on purpose. Sign up
on the form first and you will see your row show up in the admin table with its
waitlist position.

Once you are signed in, the admin lets you:

- See everyone still waiting, with their position, plus Waiting and Invited totals.
- Toggle between the **Current Waitlist** (still waiting) and **Invited Guests**
  (already sent their turn).
- **Send a "your spot is ready" email** to anyone waiting, which moves them off the
  current list into Invited Guests.
- Search signups instantly by name or email.
- Export the list to CSV.
- See a live email-status badge per row (sent, delivered, bounced, opened) once
  the Resend webhook is wired.

The password above is the owner password. Under the hood the app is multi-tenant:
a waitlist can be given its own optional password that signs that person in scoped
to just their own list, enforced down to the CSV export.

## Decision Log

I built the core first and got it working end to end, then layered the bonuses on.

**Planned vs. shipped.** The core (signup form, Postgres storage, admin view, a real
confirmation email, deployed to Vercel free tiers) shipped and I verified it end to
end. All five bonuses shipped too: waitlist position with idempotent repeat signups;
admin auth as a signed, hashed httpOnly cookie (never the password), scoped so the
owner sees every list and a per-project password sees only its own; multi-tenancy
scoped per project; Resend webhooks recording delivered/bounced/opened; plus a
honeypot, a rate limit, a health check, CI, and 34 unit tests.

**Where I got stuck.** Migrating the live table to multi-tenancy without dropping
existing rows: you cannot add a required foreign key to a populated table, so I did
it in phases (nullable column, backfill a default project onto every row, check for
orphans, then make it required). Neon also hands you two connection strings and I
used the wrong one at first: schema changes need the direct non-pooling URL, since
the pooled one just hangs on a push. I split them so each job uses the right one.

**With more time.** Move the rate limiter to a durable store like Upstash, add double
opt-in and an unsubscribe link, add an admin audit trail on top of the scoped auth,
and add integration tests against a test database.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** styled in VenueNest's brand: sage green with a forest-green CTA, serif headings on a warm cream ground
- **Prisma** + **PostgreSQL** (mirrors the VenueNest NestJS/Prisma/Postgres stack)
- **Resend** for transactional email
- **Zod** for input validation

## What It Does

- **Form** at `/`: name (optional) + email, with client and server validation.
- **Storage**: each signup is a `waitlist_entries` row, scoped to a project.
- **Admin** at `/admin`: password-gated table of signups, totals, and CSV export.
- **Email**: a confirmation with the person's waitlist position, sent via Resend.

### Extras Beyond The Brief

- Waitlist **position** returned on signup and shown in the UI + email.
- **Idempotent** signups: a repeat email returns the existing position, no error.
- **Multi-tenancy**: independent waitlists (projects). `/` is the primary list;
  `/w/[slug]` is any other list. Position and uniqueness are scoped per project.
- **Scoped admin auth**: the owner password sees every list; an optional
  per-project password scopes a session to just that one waitlist. The session
  is a signed, hashed httpOnly cookie, never the password itself.
- **Resend webhooks**: `/api/webhooks/resend` (Svix-signature verified) records
  `delivered` / `bounced` / `opened` status back onto each row, shown as a badge
  in the admin.
- **Honeypot** field + a best-effort **rate limit** to blunt bot spam.
- **CSV export** and **instant search** (by email or name) in the admin view.
- **Accessible form**: live-announced status, `role="alert"` errors, labelled inputs.
- **`/api/health`** endpoint (pings the DB) for uptime monitors and load balancers.

## Layout

```
app/
  page.tsx              landing + form (server component, live count)
  waitlist-form.tsx     the form (client component)
  w/[slug]/page.tsx     per-project waitlist page (multi-tenant)
  admin/page.tsx        password-gated dashboard (current/invited toggle, stats)
  admin/admin-table.tsx client table with instant search + email-status badges
  admin/actions.ts      login / logout / send-ready-email server actions
  api/waitlist/route.ts POST signup (validate, store, email, position, per-project)
  api/admin/export      CSV export per project (cookie-guarded)
  api/webhooks/resend   Svix-verified delivery/bounce/open webhook
  api/health            DB health check
lib/
  prisma.ts   validation.ts   email.ts   auth.ts   rate-limit.ts
prisma/schema.prisma    Project + WaitlistEntry models
```

## License

MIT, see [LICENSE](LICENSE).
