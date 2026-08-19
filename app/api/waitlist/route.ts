import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validation";
import { sendConfirmationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

function positionOf(createdAt: Date) {
  return prisma.waitlistEntry.count({ where: { createdAt: { lte: createdAt } } });
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

  const { email, name, company } = parsed.data;

  // Honeypot: a filled hidden field means a bot. Pretend success, store nothing.
  if (company && company.length > 0) {
    return NextResponse.json({ status: "ok", position: 0 });
  }

  try {
    const entry = await prisma.waitlistEntry.create({
      data: { email, name: name || null, source: "web" },
    });
    const position = await positionOf(entry.createdAt);
    await sendConfirmationEmail({ to: email, name, position });
    return NextResponse.json({ status: "ok", position });
  } catch (err) {
    // Unique-constraint violation => already signed up. Idempotent, friendly.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const existing = await prisma.waitlistEntry.findUnique({ where: { email } });
      const position = existing ? await positionOf(existing.createdAt) : 0;
      return NextResponse.json({ status: "already", position });
    }
    console.error("[waitlist] create failed:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
