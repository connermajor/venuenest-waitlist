import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isAuthed } from "@/lib/auth";
import { login, logout } from "./actions";

export const dynamic = "force-dynamic";

function LoginScreen({ error }: { error: boolean }) {
  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <form action={login} className="w-full max-w-sm rounded-lg border border-neutral-200 bg-white p-6">
        <h1 className="text-lg font-semibold text-neutral-900">Admin access</h1>
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
          className="mt-4 w-full rounded-md bg-neutral-900 px-4 py-2.5 font-medium text-white transition-colors hover:bg-neutral-800"
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

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-neutral-900">Waitlist</h1>
            <p className="mt-1 text-sm text-neutral-500">Everyone who has signed up, oldest first.</p>
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

        <div className="mt-6 overflow-hidden rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-2.5 font-medium">#</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                    No signups yet.
                  </td>
                </tr>
              ) : (
                entries.map((e, i) => (
                  <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-neutral-500">{i + 1}</td>
                    <td className="px-4 py-2.5 text-neutral-900">{e.email}</td>
                    <td className="px-4 py-2.5 text-neutral-500">{e.name ?? "—"}</td>
                    <td className="px-4 py-2.5 font-mono text-neutral-500">
                      {e.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
