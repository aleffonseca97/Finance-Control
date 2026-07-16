import { getRequestConfig } from 'next-intl/server'
import { headers } from 'next/headers'
import { routing, type AppLocale } from './routing'

function localeFromPathname(pathname: string | null): AppLocale | null {
  if (!pathname) return null
  const match = pathname.match(
    new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`),
  )
  const candidate = match?.[1]
  return candidate && routing.locales.includes(candidate as AppLocale)
    ? (candidate as AppLocale)
    : null
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale

  if (!locale || !routing.locales.includes(locale as AppLocale)) {
    // Fallback when middleware did not negotiate (e.g. composed auth paths)
    const headerStore = await headers()
    locale =
      localeFromPathname(headerStore.get('x-pathname')) ??
      localeFromPathname(headerStore.get('next-url')) ??
      routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
