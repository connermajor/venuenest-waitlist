import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { sendConfirmationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// The primary list when a signup arrives without a slug (the homepage form).
const DEFAULT_SLUG = "venuenest";

// Waitlist position is per-project: your place in line within your own list.
function positionOf(projectId: string, createdAt: Date) {
  return prisma.waitlistEntry.count({
    where: { projectId, createdAt: { lte: createdAt } },
  });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  // 20/min per IP: generous enough that a reviewer poking at the demo (behind a
  // single shared Vercel egress IP) won't trip it, while still stopping abuse.
  if (!rateLimit(`signup:${ip}`, 20)) {
    return NextResponse.json({ error: "Too many attempts. Please try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const { email, name, company, slug } = parsed.data;

  // Honeypot: a filled hidden field means a bot. Pretend success, store nothing.
  if (company && company.length > 0) {
    return NextResponse.json({ status: "ok", position: 0 });
  }

  // Resolve which waitlist (tenant) this signup belongs to.
  const project = await prisma.project.findUnique({
    where: { slug: slug || DEFAULT_SLUG },
  });
  if (!project) {
    return NextResponse.json({ error: "That waitlist doesn't exist." }, { status: 404 });
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: { projectId: project.id, email, name: name || null, source: "web" },
    });
    const position = await positionOf(project.id, entry.createdAt);

    // Send the confirmation, then record the message id so delivery/bounce
    // webhooks can reconcile against this entry. Email never blocks signup.
    const emailId = await sendConfirmationEmail({ to: email, name, position });
    if (emailId) {
      await prisma.waitlistEntry.update({
        where: { id: entry.id },
        data: { emailId, emailStatus: "sent", emailUpdatedAt: new Date() },
      });
    }

    return NextResponse.json({ status: "ok", position });
  } catch (err) {
    // Unique-constraint violation => already on this list. Idempotent, friendly.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.waitlistEntry.findUnique({
        where: { projectId_email: { projectId: project.id, email } },
      });
      const position = existing ? await positionOf(project.id, existing.createdAt) : 0;
      return NextResponse.json({ status: "already", position });
    }
    console.error("[waitlist] create failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
