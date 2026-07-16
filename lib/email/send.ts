import { getTranslations } from 'next-intl/server'
import { Resend } from 'resend'
import { isAppLocale, type AppLocale } from '@/i18n/routing'
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
      options.to,
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

function resolveLocale(locale?: string): AppLocale {
  if (locale && isAppLocale(locale)) {
    return locale
  }
  return 'pt-BR'
}

export async function sendWelcomeEmail(params: {
  to: string
  name: string | null
  locale?: string
}): Promise<SendResult> {
  const locale = resolveLocale(params.locale)
  const t = await getTranslations({ locale, namespace: 'emails' })

  return sendRaw({
    to: params.to,
    subject: t('welcome.subject'),
    html: welcomeEmailHtml(params.name, {
      greeting: t('welcome.greeting', { name: params.name ?? '' }),
      greetingGeneric: t('welcome.greetingGeneric'),
      title: t('welcome.title'),
      body: t('welcome.body'),
      footer: t('welcome.footer'),
    }, { locale, brand: t('brand') }),
  })
}

export async function sendPasswordResetEmail(params: {
  to: string
  resetUrl: string
  locale?: string
}): Promise<SendResult> {
  const locale = resolveLocale(params.locale)
  const t = await getTranslations({ locale, namespace: 'emails' })

  return sendRaw({
    to: params.to,
    subject: t('passwordReset.subject'),
    html: passwordResetEmailHtml(params.resetUrl, {
      title: t('passwordReset.title'),
      body: t('passwordReset.body'),
      button: t('passwordReset.button'),
      copyLink: t('passwordReset.copyLink'),
      ignore: t('passwordReset.ignore'),
    }, { locale, brand: t('brand') }),
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
