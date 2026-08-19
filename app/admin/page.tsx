import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isAuthed } from "@/lib/auth";
import { login, logout } from "./actions";
import AdminTable from "./admin-table";

export const dynamic = "force-dynamic";

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
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ error }, store] = await Promise.all([searchParams, cookies()]);

  if (!isAuthed(store.get(ADMIN_COOKIE)?.value)) {
    return <LoginScreen error={error === "1"} />;
  }

  const entries = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
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
  }));

  return (
    <main className="min-h-screen bg-cream px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl text-ink">Waitlist</h1>
            <p className="mt-1 text-sm text-[#6e6e6e]">Everyone who has signed up, oldest first.</p>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export"
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

        <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-sm">
          <Stat label="Total" value={total.toLocaleString()} />
          <Stat label="Today" value={today.toLocaleString()} />
        </div>

        <AdminTable entries={rows} />
      </div>
    </main>
  );
}
