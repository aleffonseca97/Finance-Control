import { Resend } from 'resend'
import { passwordResetEmailHtml, welcomeEmailHtml } from './templates'

type SendResult =
  | { ok: true; id?: string }
  | { ok: false; error: string; skipped?: boolean }

function getClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    return null
  }
  return { resend: new Resend(apiKey), from }
}

async function sendRaw(options: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  const client = getClient()
  if (!client) {
    console.warn(
      '[email] RESEND_API_KEY ou EMAIL_FROM ausente; envio ignorado para',
      options.to
    )
    return { ok: false, error: 'Email não configurado', skipped: true }
  }

  const { data, error } = await client.resend.emails.send({
    from: client.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
  })

  if (error) {
    console.error('[email] Resend error:', error)
    return { ok: false, error: error.message }
  }

  return { ok: true, id: data?.id }
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string | null
}): Promise<SendResult> {
  return sendRaw({
    to: params.to,
    subject: 'Bem-vindo ao Logos Finance',
    html: welcomeEmailHtml(params.name),
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
}): Promise<SendResult> {
  return sendRaw({
    to: params.to,
    subject: 'Redefinir sua senha — Logos Finance',
    html: passwordResetEmailHtml(params.resetUrl),
  })
}

/** Anúncios / novidades — HTML completo (ex.: arquivo lido pelo script). */
export async function sendProductUpdateEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  return sendRaw({
    to: params.to,
    subject: params.subject,
    html: params.html,
  })
}
