import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, isAuthed } from "@/lib/auth";

export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET() {
  const store = await cookies();
  if (!isAuthed(store.get(ADMIN_COOKIE)?.value)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const rows = await prisma.waitlistEntry.findMany({ orderBy: { createdAt: "asc" } });
  const header = ["position", "email", "name", "source", "created_at"];
  const lines = rows.map((r, i) =>
    [String(i + 1), r.email, r.name ?? "", r.source ?? "", r.createdAt.toISOString()]
      .map(csvCell)
      .join(","),
  );
  const csv = [header.map(csvCell).join(","), ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist.csv"`,
    },
  });
}
