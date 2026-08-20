import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { sendConfirmationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// The primary list when a signup arrives without a slug (the homepage form).
const DEFAULT_SLUG = "venuenest";

// Support address surfaced to people who are already signed up.
const SUPPORT_EMAIL = "support@venuenest-example.com";

// Waitlist position is per-project and counts only people still waiting, so it
// lines up with the "N in line" count on the page (invited guests drop off).
function positionOf(projectId: string, createdAt: Date) {
  return prisma.waitlistEntry.count({
    where: { projectId, invitedAt: null, createdAt: { lte: createdAt } },
  });
}

// Confirmation states we consider "the email actually reached them."
const DELIVERED = new Set(["sent", "delivered", "opened"]);

// Handles a signup for an email that is already on this list. Branches on where
// they are in the flow rather than silently returning the same position:
//   - already invited off the list  -> point them to their email / support
//   - confirmation already delivered -> point them to their email / support
//   - confirmation never arrived     -> re-send it, keep their place
async function respondForExisting(projectId: string, email: string, fallbackName?: string) {
  const existing = await prisma.waitlistEntry.findUnique({
    where: { projectId_email: { projectId, email } },
  });
  // Shouldn't happen (we only call this when a duplicate exists), but stay safe.
  if (!existing) {
    return NextResponse.json({ status: "created", position: 0 });
  }

  const position = await positionOf(projectId, existing.createdAt);

  if (existing.invitedAt) {
    return NextResponse.json({ status: "already_invited", position, support: SUPPORT_EMAIL });
  }
  if (DELIVERED.has(existing.emailStatus ?? "")) {
    return NextResponse.json({ status: "already_confirmed", position, support: SUPPORT_EMAIL });
  }

  // On the list but the confirmation never went through — re-send it and keep
  // their original place in line.
  const emailId = await sendConfirmationEmail({
    to: email,
    name: existing.name ?? fallbackName,
    position,
  });
  if (emailId) {
    await prisma.waitlistEntry.update({
      where: { id: existing.id },
      data: { emailId, emailStatus: "sent", emailUpdatedAt: new Date() },
    });
  }
  return NextResponse.json({ status: "already_unconfirmed", position });
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
    return NextResponse.json({ status: "created", position: 0 });
  }

  // Resolve which waitlist (tenant) this signup belongs to.
  const project = await prisma.project.findUnique({
    where: { slug: slug || DEFAULT_SLUG },
  });
  if (!project) {
    return NextResponse.json({ error: "That waitlist doesn't exist." }, { status: 404 });
  }

  // Already on this list? Branch on their situation instead of duplicating them.
  const existing = await prisma.waitlistEntry.findUnique({
    where: { projectId_email: { projectId: project.id, email } },
  });
  if (existing) {
    return respondForExisting(project.id, email, name);
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

    return NextResponse.json({ status: "created", position });
  } catch (err) {
    // Unique-constraint violation => a duplicate slipped in between our check
    // and the insert (a race). Fall back to the same branching logic.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return respondForExisting(project.id, email, name);
    }
    console.error("[waitlist] create failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
