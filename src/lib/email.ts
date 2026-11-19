import "server-only";
import { requireEnv } from "./providers";

/**
 * Outgoing email (magic links). Chosen by EMAIL_PROVIDER:
 *   console  (default) prints the email to the server log, for local development
 *   resend   sends through Resend (RESEND_API_KEY, EMAIL_FROM)
 */
export type Email = { to: string; subject: string; text: string; html: string };

export async function sendEmail(email: Email): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";

  if (provider === "console") {
    console.info(`\n[email] To: ${email.to}\n[email] Subject: ${email.subject}\n${email.text}\n`);
    return;
  }

  if (provider === "resend") {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireEnv("RESEND_API_KEY", "email")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: requireEnv("EMAIL_FROM", "email"),
        to: [email.to],
        subject: email.subject,
        text: email.text,
        html: email.html,
      }),
    });
    if (!response.ok) {
      throw new Error(`Resend rejected the email (${response.status}): ${await response.text()}`);
    }
    return;
  }

  throw new Error(`Unknown EMAIL_PROVIDER "${provider}".`);
}

export function magicLinkEmail(to: string, url: string): Email {
  return {
    to,
    subject: "Dein Anmeldelink für parl.ai",
    text: `Hier ist dein Anmeldelink für parl.ai:\n\n${url}\n\nDer Link ist 15 Minuten gültig und funktioniert nur einmal. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.`,
    html: `<div style="font-family:Georgia,serif;font-size:17px;line-height:1.5;color:#111;max-width:480px">
<p style="font-size:24px;font-weight:700;margin:0 0 24px">parl.ai</p>
<p>Hier ist dein Anmeldelink:</p>
<p style="margin:28px 0"><a href="${url}" style="background:#111;color:#fafafa;padding:12px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:15px">Anmelden</a></p>
<p style="color:#6b6b6b;font-size:14px">Der Link ist 15 Minuten gültig und funktioniert nur einmal. Wenn du ihn nicht angefordert hast, kannst du diese E-Mail ignorieren.</p>
</div>`,
  };
}
