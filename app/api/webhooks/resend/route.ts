import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Resend sends signed webhooks (via Svix) for the lifecycle of each email.
// We verify the signature, then reconcile the event against the entry we
// stored the message id on at signup time.
//
// Setup: create a webhook in the Resend dashboard pointing at
// /api/webhooks/resend, copy its signing secret into RESEND_WEBHOOK_SECRET.

// Maps a Resend event type to the status we persist on the entry.
const STATUS: Record<string, string> = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delivery_delayed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.failed": "failed",
  "email.opened": "opened",
};

type ResendEvent = {
  type?: string;
  data?: { email_id?: string };
};

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.warn("[webhook] RESEND_WEBHOOK_SECRET not set; rejecting.");
    return NextResponse.json({ error: "Webhooks not configured." }, { status: 503 });
  }

  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  let event: ResendEvent;
  try {
    event = new Webhook(secret).verify(payload, headers) as ResendEvent;
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  const emailId = event.data?.email_id;
  const status = event.type ? STATUS[event.type] : undefined;
  if (!emailId || !status) {
    // Unknown or unmapped event — acknowledge so Resend stops retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Reconcile against the entry we tagged with this message id at signup.
  const result = await prisma.waitlistEntry.updateMany({
    where: { emailId },
    data: { emailStatus: status, emailUpdatedAt: new Date() },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
