import { APP_NAME } from "@/lib/constants";

export type NotificationEmail = {
  to: string;
  subject: string;
  title: string;
  body: string;
  url: string;
};

export type EmailSendResult = { skipped: true } | { skipped?: false; id: string };

type EmailTransport = (input: NotificationEmail) => Promise<EmailSendResult>;

let transport: EmailTransport = sendViaResend;

export function setEmailTransportForTests(next: EmailTransport | null) {
  transport = next ?? sendViaResend;
}

export async function sendNotificationEmail(input: NotificationEmail): Promise<EmailSendResult> {
  return transport(input);
}

async function sendViaResend(input: NotificationEmail): Promise<EmailSendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: emailHtml(input),
      text: `${input.title}\n\n${input.body}\n\n${input.url}`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 300)}`);
  }

  const payload = (await response.json()) as { id?: string };
  return { id: payload.id ?? "sent" };
}

function emailHtml(input: NotificationEmail) {
  const escapedTitle = escapeHtml(input.title);
  const escapedBody = escapeHtml(input.body);
  const escapedUrl = escapeHtml(input.url);

  return `<!doctype html>
<html>
  <body style="font-family: Georgia, serif; background:#f4f1eb; color:#1c1917; padding:24px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e7e0d6;border-radius:12px;padding:24px;">
      <tr><td style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#1e4d3a;">${APP_NAME}</td></tr>
      <tr><td style="padding-top:12px;font-size:22px;">${escapedTitle}</td></tr>
      <tr><td style="padding-top:12px;font-size:15px;line-height:1.6;color:#57534e;">${escapedBody}</td></tr>
      <tr><td style="padding-top:24px;">
        <a href="${escapedUrl}" style="display:inline-block;background:#1e4d3a;color:#f4f1eb;text-decoration:none;padding:12px 18px;border-radius:8px;">Open in ${APP_NAME}</a>
      </td></tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
