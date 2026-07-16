'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { isAppLocale, locales, type AppLocale } from '@/i18n/routing'
import { getUserCurrency, setCurrencyCookie } from '@/app/actions/currency'

const localeSchema = z.enum(locales as unknown as [AppLocale, ...AppLocale[]])
const localesPattern = locales.join('|')

async function setLocaleCookie(locale: AppLocale) {
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

/** Strip locale prefix (e.g. /pt-BR, /en, /it) from an internal path (keeps query/hash). */
function stripLocalePrefix(path: string): string {
  const stripped = path.replace(new RegExp(`^/(${localesPattern})(?=/|$|\\?)`), '')
  if (!stripped || stripped === '') return '/'
  return stripped.startsWith('/') ? stripped : `/${stripped}`
}

/** Only allow same-origin relative paths (no protocol-relative or external URLs). */
function isSafeCallbackPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !path.includes('://')
}

export async function updateLocale(locale: string) {
  const parsed = localeSchema.safeParse(locale)
  if (!parsed.success) return { error: 'Invalid locale' }

  const nextLocale = parsed.data as AppLocale
  await setLocaleCookie(nextLocale)

  const session = await auth()
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: nextLocale },
    })
  }

  const currentLocale = await getLocale()
  revalidatePath(`/${currentLocale}/dashboard`, 'layout')
  revalidatePath(`/${nextLocale}/dashboard`, 'layout')

  return { success: true, locale: nextLocale }
}

export async function getDashboardRedirect(callbackUrl?: string | null): Promise<{
  locale: AppLocale
  href: string
}> {
  const session = await auth()
  const locale =
    session?.user?.id != null
      ? await getUserLocale(session.user.id)
      : ((await getLocale()) as AppLocale)

  await setLocaleCookie(locale)

  if (session?.user?.id) {
    await setCurrencyCookie(await getUserCurrency(session.user.id))
  }

  if (callbackUrl && isSafeCallbackPath(callbackUrl)) {
    const path = stripLocalePrefix(callbackUrl)
    // Avoid sending newly authenticated users back to auth screens
    if (!path.startsWith('/login') && !path.startsWith('/registro')) {
      return { locale, href: path }
    }
  }

  return { locale, href: '/dashboard' }
}

export async function getDashboardPathForUser(): Promise<string> {
  const { locale, href } = await getDashboardRedirect()
  return `/${locale}${href}`
}

export async function getUserLocale(userId: string): Promise<AppLocale> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  })

  if (user?.locale && isAppLocale(user.locale)) {
    return user.locale
  }

  return 'pt-BR'
}
