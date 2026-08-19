import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

type ConfirmationArgs = { to: string; name?: string | null; position: number };

// Sends the "you're on the list" email. Never throws into the request path:
// a signup should still succeed if email delivery hiccups.
export async function sendConfirmationEmail({ to, name, position }: ConfirmationArgs): Promise<void> {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping confirmation email.");
    return;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "VenueNest Waitlist <onboarding@resend.dev>";
  const greeting = name ? `Hi ${name},` : "Hi there,";

  try {
    await resend.emails.send({
      from,
      to,
      subject: "You're on the VenueNest waitlist",
      html: `
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
          <h1 style="font-size:20px;margin:0 0 12px">You're on the list</h1>
          <p style="margin:0 0 12px;line-height:1.5">${greeting}</p>
          <p style="margin:0 0 12px;line-height:1.5">Thanks for joining the VenueNest waitlist. You're <strong>#${position}</strong> in line, and we'll email you the moment your spot opens up.</p>
          <p style="margin:0 0 12px;line-height:1.5">No action needed for now.</p>
          <p style="margin:24px 0 0;font-size:13px;color:#64748b">VenueNest</p>
        </div>
      `,
    });
  } catch (err) {
    console.error("[email] failed to send confirmation:", err);
  }
}
