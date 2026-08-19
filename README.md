# VenueNest Waitlist

[![CI](https://github.com/connermajor/venuenest-waitlist/actions/workflows/ci.yml/badge.svg)](https://github.com/connermajor/venuenest-waitlist/actions/workflows/ci.yml)

A small, production-shaped waitlist tool: a signup form, Postgres storage, an
admin view, and a confirmation email on signup.

## Live demo

- **Signup form:** https://venuenest-waitlist-three.vercel.app
- **Admin view:** https://venuenest-waitlist-three.vercel.app/admin — password `venue-05955c9d`

Running live on Vercel with Neon Postgres. The admin view is a demo instance, so
the password is shared here on purpose; sign up on the form and you'll see the
row appear in the admin table with its waitlist position.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** — styled in VenueNest's brand: sage green with a forest-green CTA, serif headings on a warm cream ground
- **Prisma** + **PostgreSQL** (mirrors the VenueNest NestJS/Prisma/Postgres stack)
- **Resend** for transactional email
- **Zod** for input validation

## What it does

- **Form** at `/` — name (optional) + email, with client and server validation.
- **Storage** — each signup is a `waitlist_entries` row, scoped to a project.
- **Admin** at `/admin` — password-gated table of signups, totals, and CSV export.
- **Email** — a confirmation with the person's waitlist position, sent via Resend.

### Extras beyond the brief

- Waitlist **position** returned on signup and shown in the UI + email.
- **Idempotent** signups: a repeat email returns the existing position, no error.
- **Multi-tenancy**: independent waitlists (projects). `/` is the primary list;
  `/w/[slug]` is any other list; the admin has per-project tabs, CSV, and a
  create-project form. Position and uniqueness are scoped per project.
- **Resend webhooks**: `/api/webhooks/resend` (Svix-signature verified) records
  `delivered` / `bounced` / `opened` status back onto each row, shown as a badge
  in the admin.
- **Honeypot** field + a best-effort **rate limit** to blunt bot spam.
- **CSV export** and **instant search** (by email or name) in the admin view.
- Admin auth stores a **hashed** token in an httpOnly cookie, never the password.
- **Accessible form**: live-announced status, `role="alert"` errors, labelled inputs.
- **`/api/health`** endpoint (pings the DB) for uptime monitors and load balancers.

See [DECISIONS.md](DECISIONS.md) for the decision log — planned vs. shipped,
where I got stuck, and what I'd do next.

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

MIT — see [LICENSE](LICENSE).
