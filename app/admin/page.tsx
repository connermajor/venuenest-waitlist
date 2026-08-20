import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import logo from "@/public/venuenest-logo.png";
import { ADMIN_COOKIE, OWNER_SCOPE, verifyScope } from "@/lib/auth";
import { login, logout, createProject } from "./actions";
import AdminTable from "./admin-table";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "venuenest";

function LoginScreen({ error }: { error: boolean }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Image src={logo} alt="VenueNest" width={44} height={34} priority />
          <span className="font-serif text-lg tracking-tight text-ink">VenueNest</span>
        </div>
        <h1 className="font-serif text-4xl tracking-tight text-ink">Admin sign in</h1>
        <p className="mt-3 leading-relaxed text-[#6e6e6e]">
          Enter your password to see who has joined your waitlist.
        </p>

        <form action={login} className="mt-8 rounded-2xl border border-[#ecece3] bg-white p-7 shadow-sm">
          <label htmlFor="admin-pw" className="mb-1.5 block text-sm font-medium text-ink">
            Password
          </label>
          <input
            id="admin-pw"
            name="password"
            type="password"
            required
            autoFocus
            placeholder="Your admin password"
            aria-invalid={error}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage-deep"
          />
          {error && (
            <p role="alert" className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Incorrect password.
            </p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-md bg-forest px-4 py-2.5 font-medium text-white transition-colors hover:bg-forest-deep"
          >
            Sign in
          </button>
        </form>

        <Link href="/" className="mt-6 inline-block text-sm text-[#8f8f8f] transition-colors hover:text-sage-deep">
          &larr; Back to the site
        </Link>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="mt-1 font-mono text-2xl text-neutral-900">{value}</div>
    </div>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; project?: string; perror?: string }>;
}) {
  const [{ error, project: projectParam, perror }, store] = await Promise.all([searchParams, cookies()]);

  const scope = verifyScope(store.get(ADMIN_COOKIE)?.value);
  if (!scope) {
    return <LoginScreen error={error === "1"} />;
  }
  const isOwner = scope === OWNER_SCOPE;

  // Owner sees every list; a project-scoped session sees only its own.
  const projects = isOwner
    ? await prisma.project.findMany({ orderBy: { createdAt: "asc" } })
    : await prisma.project.findMany({ where: { id: scope } });

  // Owner honors the ?project tab; a scoped session is pinned to its project.
  const active = isOwner
    ? (projects.find((p) => p.slug === projectParam) ??
       projects.find((p) => p.slug === DEFAULT_SLUG) ??
       projects[0])
    : projects[0];

  // A scoped session whose project vanished (deleted) is effectively logged out.
  if (!active) {
    return <LoginScreen error={false} />;
  }

  const entries = await prisma.waitlistEntry.findMany({
    where: { projectId: active.id },
    orderBy: { createdAt: "asc" },
  });
  const total = entries.length;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = entries.filter((e) => e.createdAt >= startOfToday).length;

  // Serializable rows for the client table. Position is the true 1-based place
  // in the oldest-first list, so it stays meaningful even when the list is filtered.
  const rows = entries.map((e, i) => ({
    id: e.id,
    position: i + 1,
    email: e.email,
    name: e.name,
    joined: e.createdAt.toISOString().slice(0, 10),
    emailStatus: e.emailStatus,
  }));

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
          <Image src={logo} alt="VenueNest" width={38} height={29} priority />
          <span className="font-serif text-base tracking-tight text-ink">VenueNest</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">{isOwner ? "Waitlists" : active.name}</h1>
            <p className="mt-1 text-sm text-[#6e6e6e]">
              {active.name} — everyone who has signed up, oldest first.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/api/admin/export?project=${active.slug}`}
              className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400"
            >
              Export CSV
            </a>
            <form action={logout}>
              <button
                type="submit"
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Owner-only: tenant selector + create a new waitlist. */}
        {isOwner && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              {projects.map((p) => {
                const activeTab = active.id === p.id;
                return (
                  <a
                    key={p.id}
                    href={`/admin?project=${p.slug}`}
                    className={
                      activeTab
                        ? "rounded-full bg-[#5f7049] px-3.5 py-1.5 text-sm font-medium text-white"
                        : "rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400"
                    }
                  >
                    {p.name}
                  </a>
                );
              })}
            </div>

            <form
              action={createProject}
              className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-neutral-200 bg-white p-4"
            >
              <div>
                <label htmlFor="np-name" className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  New waitlist name
                </label>
                <input
                  id="np-name"
                  name="name"
                  required
                  placeholder="Garden Pavilion Events"
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
                />
              </div>
              <div>
                <label htmlFor="np-slug" className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Slug
                </label>
                <input
                  id="np-slug"
                  name="slug"
                  required
                  placeholder="garden-pavilion"
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
                />
              </div>
              <div>
                <label htmlFor="np-pw" className="mb-1 block text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Admin password <span className="lowercase text-neutral-400">(optional)</span>
                </label>
                <input
                  id="np-pw"
                  name="password"
                  type="password"
                  placeholder="lets this list's admin sign in"
                  className="w-56 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
                />
              </div>
              <button
                type="submit"
                className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep"
              >
                Create
              </button>
              {perror && (
                <span className="text-sm text-red-700">
                  {perror === "taken" ? "That slug is already taken." : "Check the name, slug, and password (6+ chars)."}
                </span>
              )}
            </form>
          </>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Stat label="Total" value={total.toLocaleString()} />
          <Stat label="Today" value={today.toLocaleString()} />
        </div>

        <AdminTable entries={rows} />
      </div>
    </main>
  );
}
