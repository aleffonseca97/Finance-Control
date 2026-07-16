import { redirect as nextRedirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'

export async function localeRedirect(href: string): Promise<never> {
  const locale = await getLocale()
  const path = href.startsWith('/') ? href : `/${href}`
  nextRedirect(`/${locale}${path}`)
}
