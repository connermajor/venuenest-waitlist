import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isAuthed } from "@/lib/auth";
import { login, logout, createProject } from "./actions";
import AdminTable from "./admin-table";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "venuenest";

function LoginScreen({ error }: { error: boolean }) {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center px-6">
      <form action={login} className="w-full max-w-sm rounded-2xl border border-[#ecece3] bg-white p-6 shadow-sm">
        <h1 className="font-serif text-xl text-ink">Admin access</h1>
        <p className="mt-1 text-sm text-neutral-500">Enter the admin password to view signups.</p>
        <input
          name="password"
          type="password"
          required
          placeholder="Password"
          className="mt-4 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-900"
        />
        {error && (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            Incorrect password.
          </p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-md bg-[#5f7049] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#4e5d3b]"
        >
          Sign in
        </button>
      </form>
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

  if (!isAuthed(store.get(ADMIN_COOKIE)?.value)) {
    return <LoginScreen error={error === "1"} />;
  }

  // All tenants, with the default list pinned first.
  const projects = await prisma.project.findMany({ orderBy: { createdAt: "asc" } });
  const active =
    projects.find((p) => p.slug === projectParam) ??
    projects.find((p) => p.slug === DEFAULT_SLUG) ??
    projects[0];

  const entries = active
    ? await prisma.waitlistEntry.findMany({
        where: { projectId: active.id },
        orderBy: { createdAt: "asc" },
      })
    : [];
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">Waitlists</h1>
            <p className="mt-1 text-sm text-[#6e6e6e]">
              {active ? `${active.name} — everyone who has signed up, oldest first.` : "No waitlists yet."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {active && (
              <a
                href={`/api/admin/export?project=${active.slug}`}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:border-neutral-400"
              >
                Export CSV
              </a>
            )}
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

        {/* Tenant selector: one tab per waitlist. */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {projects.map((p) => {
            const isActive = active?.id === p.id;
            return (
              <a
                key={p.id}
                href={`/admin?project=${p.slug}`}
                className={
                  isActive
                    ? "rounded-full bg-[#5f7049] px-3.5 py-1.5 text-sm font-medium text-white"
                    : "rounded-full border border-neutral-300 bg-white px-3.5 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400"
                }
              >
                {p.name}
              </a>
            );
          })}
        </div>

        {/* Create a new waitlist. */}
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
          <button
            type="submit"
            className="rounded-md bg-forest px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-forest-deep"
          >
            Create
          </button>
          {perror && (
            <span className="text-sm text-red-700">
              {perror === "taken" ? "That slug is already taken." : "Check the name and slug."}
            </span>
          )}
        </form>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Stat label="Total" value={total.toLocaleString()} />
          <Stat label="Today" value={today.toLocaleString()} />
        </div>

        {active && <AdminTable entries={rows} />}
      </div>
    </main>
  );
}
