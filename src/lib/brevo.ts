// ════════════════════════════════════════════════════════════════════
// brevo.ts — transactional email via Brevo REST API. SERVER-ONLY.
// Free tier: 9,000 emails/month. Used for reservation alerts, staff invites,
// monthly PDF reports.
// ════════════════════════════════════════════════════════════════════
import 'server-only'

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email'

export interface SendEmailParams {
  to: string | string[]
  subject: string
  htmlContent: string
  textContent?: string
  fromEmail?: string
  fromName?: string
  replyTo?: string
}

export async function sendEmail(params: SendEmailParams): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) return { ok: false, error: 'BREVO_API_KEY not set' }

  const recipients = (Array.isArray(params.to) ? params.to : [params.to]).map((email) => ({ email }))

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: params.fromEmail ?? process.env.OWNER_EMAIL ?? 'no-reply@menuos.app',
        name: params.fromName ?? 'MenuOS',
      },
      to: recipients,
      subject: params.subject,
      htmlContent: params.htmlContent,
      textContent: params.textContent,
      replyTo: params.replyTo ? { email: params.replyTo } : undefined,
    }),
  })

  if (!res.ok) {
    const error = await res.text().catch(() => res.statusText)
    return { ok: false, error }
  }
  const data = (await res.json().catch(() => ({}))) as { messageId?: string }
  return { ok: true, id: data.messageId }
}
