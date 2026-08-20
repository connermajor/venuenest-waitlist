import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// Hosted brand mark (served from /public on the deployed site).
const LOGO_URL = "https://venuenest-waitlist-three.vercel.app/venuenest-logo.png";
const SERIF = "Georgia, 'Times New Roman', serif";

type ConfirmationArgs = { to: string; name?: string | null; position: number };

// Sends the "you're on the list" email. Never throws into the request path:
// a signup should still succeed if email delivery hiccups. Returns the Resend
// message id (used to reconcile later delivery/bounce webhooks), or null.
export async function sendConfirmationEmail({ to, name, position }: ConfirmationArgs): Promise<string | null> {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping confirmation email.");
    return null;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "VenueNest Waitlist <onboarding@resend.dev>";
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const html = `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">You're on the VenueNest waitlist — you're #${position} in line.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f1;padding:40px 0;font-family:${SERIF};">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;">
        <tr><td align="center" style="padding-bottom:6px;">
          <img src="${LOGO_URL}" width="92" alt="VenueNest" style="display:block;border:0;width:92px;height:auto;" />
        </td></tr>
        <tr><td align="center" style="padding-bottom:26px;">
          <span style="font-family:${SERIF};font-size:14px;letter-spacing:0;color:#8a8a82;">VenueNest</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border:1px solid #ecece3;border-radius:14px;padding:40px 40px 36px;">
          <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:26px;font-weight:normal;color:#2e2e2a;text-align:center;">You're on the list</h1>
          <p style="margin:0 0 16px;font-family:${SERIF};font-size:16px;line-height:1.6;color:#4a4a44;">${greeting}</p>
          <p style="margin:0 0 8px;font-family:${SERIF};font-size:16px;line-height:1.6;color:#4a4a44;">Thank you for joining the VenueNest waitlist. We're building the software that runs your whole wedding venue, from the first inquiry to the last dance, and we'd love to have you along.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#f2f5ec;border:1px solid #d7e0c9;border-radius:12px;padding:18px 36px;">
              <div style="font-family:${SERIF};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6e7f58;">Your place in line</div>
              <div style="font-family:${SERIF};font-size:34px;color:#5f7049;padding-top:4px;">#${position}</div>
            </td></tr></table>
          </td></tr></table>
          <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.6;color:#4a4a44;text-align:center;">We'll email you the moment your spot opens.</p>
        </td></tr>
        <tr><td align="center" style="padding:26px 20px 0;">
          <p style="margin:0;font-family:${SERIF};font-size:13px;line-height:1.6;color:#a3a39a;font-style:italic;">The software that runs your whole venue, from first inquiry to last dance.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "You're on the VenueNest waitlist",
      html,
    });
    if (error) {
      console.error("[email] failed to send confirmation:", error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[email] failed to send confirmation:", err);
    return null;
  }
}

type ReadyArgs = { to: string; name?: string | null };

// Sends the "your spot is ready" email when the venue owner invites someone off
// the waitlist. Same warm brand as the confirmation. Returns the Resend message
// id or null; never throws into the request path.
export async function sendReadyEmail({ to, name }: ReadyArgs): Promise<string | null> {
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY not set; skipping ready email.");
    return null;
  }

  const resend = new Resend(apiKey);
  const from = process.env.EMAIL_FROM ?? "VenueNest Waitlist <onboarding@resend.dev>";
  const greeting = name ? `Hi ${name},` : "Hi there,";

  const html = `
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">Good news — your VenueNest spot is ready and it's your turn.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f6f1;padding:40px 0;font-family:${SERIF};">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;">
        <tr><td align="center" style="padding-bottom:6px;">
          <img src="${LOGO_URL}" width="92" alt="VenueNest" style="display:block;border:0;width:92px;height:auto;" />
        </td></tr>
        <tr><td align="center" style="padding-bottom:26px;">
          <span style="font-family:${SERIF};font-size:14px;letter-spacing:0;color:#8a8a82;">VenueNest</span>
        </td></tr>
        <tr><td style="background-color:#ffffff;border:1px solid #ecece3;border-radius:14px;padding:40px 40px 36px;">
          <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:26px;font-weight:normal;color:#2e2e2a;text-align:center;">It's your turn</h1>
          <p style="margin:0 0 16px;font-family:${SERIF};font-size:16px;line-height:1.6;color:#4a4a44;">${greeting}</p>
          <p style="margin:0 0 8px;font-family:${SERIF};font-size:16px;line-height:1.6;color:#4a4a44;">Great news. A spot has opened up on VenueNest and it's officially your turn. We're so glad you waited, and we can't wait to help you run your whole venue, from the first inquiry to the last dance.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="background-color:#f2f5ec;border:1px solid #d7e0c9;border-radius:12px;padding:18px 36px;">
              <div style="font-family:${SERIF};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#6e7f58;">Your spot is</div>
              <div style="font-family:${SERIF};font-size:30px;color:#5f7049;padding-top:4px;">Ready</div>
            </td></tr></table>
          </td></tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:2px 0 6px;">
            <a href="https://venuenest-waitlist-three.vercel.app" style="display:inline-block;background-color:#3a5a40;color:#ffffff;font-family:${SERIF};font-size:16px;text-decoration:none;padding:12px 30px;border-radius:8px;">Claim your spot</a>
          </td></tr></table>
          <p style="margin:14px 0 0;font-family:${SERIF};font-size:14px;line-height:1.6;color:#8a8a82;text-align:center;">We'll follow up shortly to get you set up.</p>
        </td></tr>
        <tr><td align="center" style="padding:26px 20px 0;">
          <p style="margin:0;font-family:${SERIF};font-size:13px;line-height:1.6;color:#a3a39a;font-style:italic;">The software that runs your whole venue, from first inquiry to last dance.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>`;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: "Your VenueNest spot is ready",
      html,
    });
    if (error) {
      console.error("[email] failed to send ready email:", error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[email] failed to send ready email:", err);
    return null;
  }
}
