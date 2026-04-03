/**
 * Base URL for links in transactional emails (password reset, etc.).
 */
export function getAppBaseUrl(): string {
  const raw =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (!raw) {
    throw new Error(
      'Defina NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL para gerar links nos e-mails.'
    )
  }
  return raw.replace(/\/$/, '')
}
