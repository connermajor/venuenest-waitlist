"use client";

import { useState } from "react";

export type AdminRow = {
  id: string;
  position: number;
  email: string;
  name: string | null;
  joined: string;
};

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
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                  No matches for &ldquo;{q.trim()}&rdquo;.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr key={e.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2.5 font-mono text-neutral-500">{e.position}</td>
                  <td className="px-4 py-2.5 text-neutral-900">{e.email}</td>
                  <td className="px-4 py-2.5 text-neutral-500">{e.name ?? "—"}</td>
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
