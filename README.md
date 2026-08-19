# VenueNest Waitlist

A small, production-shaped waitlist tool: a signup form, Postgres storage, an
admin view, and a confirmation email on signup. Built to deploy on Vercel free
tier with a free Supabase (or Vercel) Postgres.

## Stack

- **Next.js 15** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4**, Geist typeface — monochrome, borders-over-shadows
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

## Run locally

```bash
npm install
cp .env.example .env        # fill in DATABASE_URL (+ RESEND_API_KEY, ADMIN_PASSWORD)
npm run db:push             # create the table in your database
npm run dev                 # http://localhost:3000  (admin at /admin)
```

Without `RESEND_API_KEY` the app still works — it just logs "skipping email"
instead of sending, so you can develop without a mail provider.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Create a free **Supabase** project. Copy the pooled connection string
   (Settings → Database → Connection string → URI, port 6543) into a Vercel env
   var `DATABASE_URL`.
3. Add `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_PASSWORD`, and `ADMIN_SECRET` in
   Vercel → Settings → Environment Variables (Production + Preview).
4. Create the table once: run `npm run db:push` locally against the same
   `DATABASE_URL`, or `npx prisma migrate deploy` in a build step.
5. Deploy. The form is at `/`, the admin view at `/admin`.

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
