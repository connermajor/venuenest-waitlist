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
- **Storage** — each signup is a `waitlist_entries` row (unique email).
- **Admin** at `/admin` — password-gated table of signups, totals, and CSV export.
- **Email** — a confirmation with the person's waitlist position, sent via Resend.

### Extras beyond the brief

- Waitlist **position** returned on signup and shown in the UI + email.
- **Idempotent** signups: a repeat email returns the existing position, no error.
- **Honeypot** field + a best-effort **rate limit** to blunt bot spam.
- **CSV export** from the admin view.
- Admin auth stores a **hashed** token in an httpOnly cookie, never the password.

## Layout

```
app/
  page.tsx              landing + form (server component, live count)
  waitlist-form.tsx     the form (client component)
  admin/page.tsx        password-gated signups table
  admin/actions.ts      login / logout server actions
  api/waitlist/route.ts POST signup (validate, store, email, position)
  api/admin/export      CSV export (cookie-guarded)
lib/
  prisma.ts   validation.ts   email.ts   auth.ts   rate-limit.ts
prisma/schema.prisma    WaitlistEntry model
```

## License

MIT — see [LICENSE](LICENSE).
