import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, OWNER_SCOPE, verifyScope } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_SLUG = "venuenest";

function csvCell(v: string): string {
  return `"${v.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const store = await cookies();
  const scope = verifyScope(store.get(ADMIN_COOKIE)?.value);
  if (!scope) {
    return new Response("Unauthorized", { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("project") || DEFAULT_SLUG;
  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) {
    return new Response("Not found", { status: 404 });
  }

  // A project-scoped session can only export its own list; the owner exports any.
  if (scope !== OWNER_SCOPE && scope !== project.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await prisma.waitlistEntry.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  const header = ["position", "email", "name", "source", "email_status", "created_at"];
  const lines = rows.map((r, i) =>
    [String(i + 1), r.email, r.name ?? "", r.source ?? "", r.emailStatus ?? "", r.createdAt.toISOString()]
      .map(csvCell)
      .join(","),
  );
  const csv = [header.map(csvCell).join(","), ...lines].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="waitlist-${project.slug}.csv"`,
    },
  });
}
