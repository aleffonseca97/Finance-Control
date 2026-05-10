/**
 * Base URL for links in transactional emails (password reset, etc.).
 */
function readAppBaseRaw(): string | undefined {
  return (
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  )
}

/** Base URL quando configurada; útil para CTAs em e-mail sem falhar o envio. */
export function getOptionalAppBaseUrl(): string | null {
  const raw = readAppBaseRaw()
  return raw ? raw.replace(/\/$/, '') : null
}

export function getAppBaseUrl(): string {
  const raw = readAppBaseRaw()
  if (!raw) {
    throw new Error(
      'Defina NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL para gerar links nos e-mails.'
    )
  }
  return raw.replace(/\/$/, '')
}
