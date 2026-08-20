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

- See every signup with its position, plus totals for all-time and today.
- Switch between waitlists with per-project tabs (this is a multi-tenant app).
- Search signups instantly by name or email.
- Export any list to CSV.
- See a live email-status badge per row (sent, delivered, bounced, opened) once
  the Resend webhook is wired.
- Create a new waitlist, with an optional password for that list.

The password above is the owner password, so it sees every waitlist. Each waitlist
can also be given its own optional password, which signs that person in scoped to
just their own list.

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
  `/w/[slug]` is any other list; the admin has per-project tabs, CSV, and a
  create-project form. Position and uniqueness are scoped per project.
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
  admin/page.tsx        password-gated dashboard (project tabs, stats, table)
  admin/admin-table.tsx client table with instant search + email-status badges
  admin/actions.ts      login / logout / create-project server actions
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

## Decision Log

I built the core first and got it working end to end, then added the bonuses on
top of it. Here is what I planned, what I actually shipped, where I got stuck,
and what I would do next.

### What I Planned vs. What I Shipped

The core plan was a signup form for name and email, Postgres storage, an admin
view, and a real confirmation email, all deployed to Vercel on free tiers. That
all shipped and I verified it end to end.

On top of the core I shipped all five optional bonuses, plus a little more:

- Waitlist position on signup, shown in both the UI and the email. Repeat
  signups are idempotent, so the same email gets the same position back instead
  of an error.
- Admin auth that stores a signed, hashed session in an httpOnly cookie and never
  the password itself. I took this a step past the brief: the session is scoped,
  so the owner password sees every list and an optional per-project password only
  sees its own waitlist. That scope is enforced on the CSV export too.
- Multi-tenancy. Each waitlist is a project, and email uniqueness and position
  are scoped per project. The homepage is the primary list and `/w/[slug]` serves
  any other one.
- Resend webhooks. I store the message id when the email sends, then a
  signature-verified webhook records delivered, bounced, complained, and opened
  status back onto each row. The admin shows it as a badge.
- Better error and loading states, with an accessible form (live-announced
  status, an alert on errors, labelled inputs).
- Real-world hardening: a honeypot field, a per-IP rate limit, a `/api/health`
  check, GitHub Actions CI, and 34 unit tests.

### Where I Got Stuck, And How I Got Unstuck

- Migrating the live table to multi-tenancy without dropping the signups already
  in it. You cannot add a required foreign key to a table that already has rows.
  I did it in phases instead: added the column as nullable, ran a backfill that
  created a default project and attached every existing row to it, checked there
  were no orphans left, then made the column required.
- Neon gives you two connection strings and I used the wrong one at first. Schema
  changes need the direct, non-pooling URL, and the pooled one is for the app at
  runtime. The pooled one just hangs on a schema push. I split them so each job
  uses the right one.
- A rate-limit test kept failing on my machine for the wrong reason. Vercel
  replaces `x-forwarded-for` with the real client IP, so every request from one
  machine looked like the same IP. Once I understood that, I keyed the limiter on
  that header on purpose and pointed the test at the library default.

### What I Would Do With More Time

- Move the rate limiter to a durable store like Upstash so it survives cold
  starts and works across instances.
- Add double opt-in and an unsubscribe link, which a real waitlist needs for
  deliverability and compliance.
- Add an admin audit trail (who signed in, who exported) on top of the scoped
  auth that is already in place.
- Add integration tests around the API route and the webhook with a test
  database, not just unit tests on the pure functions.
