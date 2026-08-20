import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import logo from "@/public/venuenest-logo.png";
import { ADMIN_COOKIE, OWNER_SCOPE, verifyScope } from "@/lib/auth";
import { login, logout } from "./actions";
import AdminTable from "./admin-table";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "venuenest";

// Dates are shown in the venue's local time so an evening signup never rolls
// over to "tomorrow" the way a raw UTC date does.
const dateFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Denver",
  year: "numeric",
  month: "short",
  day: "numeric",
});

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

        <p className="mt-4 text-xs leading-relaxed text-[#9a9a92]">
          This is a demo instance. The admin password is published in the{" "}
          <a
            href="https://github.com/connermajor/venuenest-waitlist#admin-access"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition-colors hover:text-sage-deep"
          >
            project README
          </a>{" "}
          on GitHub.
        </p>

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
  searchParams: Promise<{ error?: string; project?: string; view?: string }>;
}) {
  const [{ error, project: projectParam, view: viewParam }, store] = await Promise.all([
    searchParams,
    cookies(),
  ]);

  const scope = verifyScope(store.get(ADMIN_COOKIE)?.value);
  if (!scope) {
    return <LoginScreen error={error === "1"} />;
  }
  const isOwner = scope === OWNER_SCOPE;

  // Owner defaults to the primary VenueNest list; a scoped session is pinned.
  const active = isOwner
    ? (await prisma.project.findUnique({ where: { slug: projectParam ?? DEFAULT_SLUG } })) ??
      (await prisma.project.findFirst({ orderBy: { createdAt: "asc" } }))
    : await prisma.project.findUnique({ where: { id: scope } });

  // A scoped session whose project vanished (deleted) is effectively logged out.
  if (!active) {
    return <LoginScreen error={false} />;
  }

  const view = viewParam === "invited" ? "invited" : "current";

  // Current = still waiting (no ready email sent). Invited = already sent theirs.
  const [waitingCount, invitedCount] = await Promise.all([
    prisma.waitlistEntry.count({ where: { projectId: active.id, invitedAt: null } }),
    prisma.waitlistEntry.count({ where: { projectId: active.id, NOT: { invitedAt: null } } }),
  ]);

  const entries = await prisma.waitlistEntry.findMany({
    where: view === "invited" ? { projectId: active.id, NOT: { invitedAt: null } } : { projectId: active.id, invitedAt: null },
    orderBy: view === "invited" ? { invitedAt: "desc" } : { createdAt: "asc" },
  });

  // Serializable rows for the client table.
  const rows = entries.map((e, i) => ({
    id: e.id,
    position: i + 1,
    email: e.email,
    name: e.name,
    joined: dateFmt.format(e.createdAt),
    invited: e.invitedAt ? dateFmt.format(e.invitedAt) : null,
    emailStatus: e.emailStatus,
  }));

  const tab = (key: "current" | "invited", label: string, n: number) => {
    const on = view === key;
    return (
      <a
        href={`/admin?view=${key}`}
        className={
          on
            ? "rounded-full bg-forest px-4 py-1.5 text-sm font-medium text-white"
            : "rounded-full border border-neutral-300 bg-white px-4 py-1.5 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400"
        }
      >
        {label} <span className={on ? "text-white/70" : "text-neutral-400"}>({n})</span>
      </a>
    );
  };

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="mb-6 inline-flex items-center gap-2.5">
          <Image src={logo} alt="VenueNest" width={38} height={29} priority />
          <span className="font-serif text-base tracking-tight text-ink">VenueNest</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">{active.name}</h1>
            <p className="mt-1 text-sm text-[#6e6e6e]">
              {view === "invited"
                ? "Guests you've already invited off the list, most recent first."
                : "Everyone still waiting for a spot, oldest first."}
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

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {tab("current", "Current Waitlist", waitingCount)}
          {tab("invited", "Invited Guests", invitedCount)}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Stat label="Waiting" value={waitingCount.toLocaleString()} />
          <Stat label="Invited" value={invitedCount.toLocaleString()} />
        </div>

        <AdminTable entries={rows} view={view} />
      </div>
    </main>
  );
}
