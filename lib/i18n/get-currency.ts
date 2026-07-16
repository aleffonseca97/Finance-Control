import { cookies } from 'next/headers'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  defaultCurrency,
  isAppCurrency,
  type AppCurrency,
} from '@/lib/i18n/currency'

/** Server-side: cookie first (synced on login/update), DB fallback. */
export async function getCurrentCurrency(): Promise<AppCurrency> {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('NEXT_CURRENCY')?.value
  if (fromCookie && isAppCurrency(fromCookie)) return fromCookie

  const session = await auth()
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferredCurrency: true },
    })
    if (user?.preferredCurrency && isAppCurrency(user.preferredCurrency)) {
      return user.preferredCurrency
    }
  }

  return defaultCurrency
}
