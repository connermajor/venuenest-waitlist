"use client";

import { useState } from "react";

export type AdminRow = {
  id: string;
  position: number;
  email: string;
  name: string | null;
  joined: string;
  emailStatus: string | null;
};

// Maps a Resend delivery status to a small colored badge. Null = we never
// recorded a send (e.g. RESEND_API_KEY absent in that environment).
function StatusBadge({ status }: { status: string | null }) {
  const s = status ?? "unknown";
  const tone: Record<string, string> = {
    delivered: "border-green-200 bg-green-50 text-green-700",
    sent: "border-sage-line bg-sage-tint text-sage-deep",
    opened: "border-green-200 bg-green-50 text-green-700",
    bounced: "border-red-200 bg-red-50 text-red-700",
    complained: "border-red-200 bg-red-50 text-red-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    delivery_delayed: "border-amber-200 bg-amber-50 text-amber-700",
    unknown: "border-neutral-200 bg-neutral-50 text-neutral-500",
  };
  const cls = tone[s] ?? tone.unknown;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {s.replace(/_/g, " ")}
    </span>
  );
}

export default function AdminTable({ entries }: { entries: AdminRow[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = query
    ? entries.filter(
        (e) =>
          e.email.toLowerCase().includes(query) ||
          (e.name?.toLowerCase().includes(query) ?? false),
      )
    : entries;

  return (
    <div>
      <div className="mt-6 flex items-center justify-between gap-3">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by email or name"
          aria-label="Search signups by email or name"
          className="w-full max-w-xs rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-ink placeholder-neutral-400 outline-none transition-colors focus:border-sage"
        />
        <span className="shrink-0 font-mono text-sm text-[#6e6e6e]" aria-live="polite">
          {query ? `${filtered.length} of ${entries.length}` : entries.length.toLocaleString()}
        </span>
      </div>

      <div className="mt-3 overflow-hidden rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <th className="px-4 py-2.5 font-medium">#</th>
              <th className="px-4 py-2.5 font-medium">Email</th>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Email status</th>
              <th className="px-4 py-2.5 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No signups yet.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                  No matches for &ldquo;{q.trim()}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-neutral-500">{e.position}</td>
                  <td className="px-4 py-2.5 text-neutral-900">{e.email}</td>
                  <td className="px-4 py-2.5 text-neutral-500">{e.name ?? "—"}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={e.emailStatus} /></td>
                  <td className="px-4 py-2.5 font-mono text-neutral-500">{e.joined}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
