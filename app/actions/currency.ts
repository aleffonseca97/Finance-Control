'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getLocale } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  currencies,
  defaultCurrency,
  isAppCurrency,
  type AppCurrency,
} from '@/lib/i18n/currency'

const currencySchema = z.enum(currencies as unknown as [AppCurrency, ...AppCurrency[]])

export async function setCurrencyCookie(currency: AppCurrency) {
  const cookieStore = await cookies()
  cookieStore.set('NEXT_CURRENCY', currency, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}

export async function updateCurrency(currency: string) {
  const parsed = currencySchema.safeParse(currency)
  if (!parsed.success) return { error: 'Invalid currency' }

  const nextCurrency = parsed.data
  await setCurrencyCookie(nextCurrency)

  const session = await auth()
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferredCurrency: nextCurrency },
    })
  }

  const locale = await getLocale()
  revalidatePath(`/${locale}/dashboard`, 'layout')

  return { success: true, currency: nextCurrency }
}

export async function getUserCurrency(userId: string): Promise<AppCurrency> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferredCurrency: true },
  })

  if (user?.preferredCurrency && isAppCurrency(user.preferredCurrency)) {
    return user.preferredCurrency
  }

  return defaultCurrency
}
