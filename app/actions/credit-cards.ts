'use server'

import { getLocale } from 'next-intl/server'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureGlobalCategories } from '@/app/actions/categories'
import { budgetExpenseWhere } from '@/lib/budget-expense'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import {
  serializeOverdueNotices,
  type CreditCardOverdueNotice,
} from '@/lib/credit-card-overdue'
import { formatCurrency, formatDate } from '@/lib/i18n/format'
import { getCurrentCurrency } from '@/lib/i18n/get-currency'
import type { AppLocale } from '@/i18n/routing'
import {
  allocatePaymentsFifo,
  billingCycleForClosingEnd,
  dateOnlyInRange,
  isDueDatePassed,
  listClosingEndsOnOrBefore,
  normalizePeriodEndKey,
  roundMoney,
  startOfDay,
} from '@/lib/credit-card-billing'

export type { CreditCardOverdueNotice, SerializedCreditCardOverdue } from '@/lib/credit-card-overdue'

function buildCreditCardSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    totalLimit: z.coerce.number().min(0, t('amountPositive')),
    closingDay: z.coerce.number().min(1, t('invalidDay')).max(31, t('invalidDay')),
    dueDay: z.coerce.number().min(1, t('invalidDay')).max(31, t('invalidDay')),
    lastFour: z.string().max(4).optional().nullable(),
    color: z.string().optional(),
  })
}

function buildPaySchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    creditCardId: z.string().min(1),
    amount: z.coerce.number().positive(t('amountPositive')),
    date: z.string().min(1, t('dateRequired')),
  })
}

const CREDIT_CARD_PATHS = [
  '/dashboard/cartao-credito',
  '/dashboard/saidas',
  '/dashboard',
  '/dashboard/analise',
]

export async function getAvailableCashForMonth(
  userId: string,
  month: number,
  year: number,
) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const [inc, cashExp, inv] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        date: { gte: start, lte: end },
        ...budgetExpenseWhere,
      },
      _sum: { amount: true },
    }),
    prisma.investment.aggregate({
      where: { userId, date: { gte: start, lte: end }, affectsCash: true },
      _sum: { amount: true },
    }),
  ])
  const income = inc._sum.amount ?? 0
  const cashExpense = cashExp._sum.amount ?? 0
  const investment = inv._sum.amount ?? 0
  return roundMoney(income - investment - cashExpense)
}

type ChargeRecord = { amount: number; date: Date; creditCardId: string | null }
type PaymentRecord = { amount: number; date: Date; paysCreditCardId: string | null }
type CardWithBilling = { id: string; name: string; closingDay: number; dueDay: number; lastFour: string | null; color: string | null }

function buildCyclesForCard(
  card: CardWithBilling,
  charges: ChargeRecord[],
  payments: PaymentRecord[],
  today: Date,
) {
  const cardCharges = charges.filter((c) => c.creditCardId === card.id)
  const cardPayments = payments
    .filter((p) => p.paysCreditCardId === card.id)
    .map((p) => ({ date: p.date, amount: p.amount }))

  const closingEnds = listClosingEndsOnOrBefore(today, card.closingDay, 48)
  const cyclesData = closingEnds.map((closingEnd) => {
    const cycle = billingCycleForClosingEnd(closingEnd, card.closingDay, card.dueDay)
    const invoice = roundMoney(
      cardCharges
        .filter((t) => dateOnlyInRange(t.date, cycle.periodStart, cycle.periodEnd))
        .reduce((s, t) => s + t.amount, 0),
    )
    return { ...cycle, closingEnd, invoice }
  })

  const allocMap = allocatePaymentsFifo(
    cyclesData.map((x) => ({ periodEnd: x.periodEnd, invoice: x.invoice })),
    cardPayments,
  )

  return { cyclesData, allocMap }
}

async function fetchChargesAndPayments(userId: string) {
  return Promise.all([
    prisma.transaction.findMany({
      where: { userId, type: 'expense', creditCardId: { not: null } },
      select: { amount: true, date: true, creditCardId: true },
    }),
    prisma.transaction.findMany({
      where: { userId, type: 'expense', paysCreditCardId: { not: null } },
      select: { amount: true, date: true, paysCreditCardId: true },
    }),
  ])
}

export async function getCreditCardOverdueNotices(
  userId: string,
): Promise<CreditCardOverdueNotice[]> {
  const locale = (await getLocale()) as AppLocale
  const today = new Date()
  const cards = await prisma.creditCard.findMany({ where: { userId } })
  if (cards.length === 0) return []

  const [charges, payments] = await fetchChargesAndPayments(userId)
  const notices: CreditCardOverdueNotice[] = []

  for (const card of cards) {
    const { cyclesData, allocMap } = buildCyclesForCard(card, charges, payments, today)

    for (const c of cyclesData) {
      const unpaid = roundMoney(c.invoice - (allocMap.get(startOfDay(c.periodEnd).getTime()) ?? 0))
      if (unpaid <= 1e-6) continue
      if (!isDueDatePassed(c.dueDate, today)) continue

      notices.push({
        cardId: card.id,
        cardName: card.name,
        lastFour: card.lastFour,
        color: card.color,
        unpaid,
        dueDate: c.dueDate,
        closingLabel: formatDate(normalizePeriodEndKey(c.periodEnd), locale),
      })
    }
  }

  return notices
}

export async function getCreditCardPagePayload() {
  const session = await auth()
  if (!session?.user?.id) return null

  await ensureGlobalCategories()

  const now = new Date()
  const [cards, availableCash, overdueRaw, creditCardCategorySpendingRaw] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
    getAvailableCashForMonth(session.user.id, now.getMonth(), now.getFullYear()),
    getCreditCardOverdueNotices(session.user.id),
    prisma.transaction.findMany({
      where: {
        userId: session.user.id,
        type: 'expense',
        creditCardId: { not: null },
      },
      select: {
        amount: true,
        category: {
          select: {
            group: true,
            name: true,
            color: true,
          },
        },
      },
    }),
  ])

  const groupedMap = new Map<string, { value: number; color: string | null }>()
  for (const transaction of creditCardCategorySpendingRaw) {
    const groupName = transaction.category.group ?? transaction.category.name
    const current = groupedMap.get(groupName)
    groupedMap.set(groupName, {
      value: (current?.value ?? 0) + transaction.amount,
      color: current?.color ?? transaction.category.color ?? null,
    })
  }

  const creditCardCategorySpending = Array.from(groupedMap.entries())
    .map(([name, item]) => ({
      name,
      value: roundMoney(item.value),
      color: item.color,
    }))
    .sort((a, b) => b.value - a.value)

  const locale = (await getLocale()) as AppLocale

  return {
    cards,
    availableCash,
    month: now.getMonth(),
    year: now.getFullYear(),
    overdueNotices: serializeOverdueNotices(overdueRaw, locale),
    creditCardCategorySpending,
  }
}

export async function getCreditCards() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.creditCard.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  })
}

export async function createCreditCard(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tValidation = await getValidationTranslations()
  const creditCardSchema = buildCreditCardSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const lastFour = formData.get('lastFour')
  const parsed = creditCardSchema.safeParse({
    name: formData.get('name'),
    totalLimit: formData.get('totalLimit'),
    closingDay: formData.get('closingDay'),
    dueDay: formData.get('dueDay'),
    lastFour: lastFour && String(lastFour).trim() ? String(lastFour).replace(/\D/g, '').slice(-4) : null,
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const totalLimit = parsed.data.totalLimit
  await prisma.creditCard.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      totalLimit,
      limit: totalLimit,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  await revalidateLocalePaths(['/dashboard/cartao-credito'])
  return { success: true }
}

export async function updateCreditCard(id: string, formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const creditCardSchema = buildCreditCardSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const lastFour = formData.get('lastFour')
  const parsed = creditCardSchema.safeParse({
    name: formData.get('name'),
    totalLimit: formData.get('totalLimit'),
    closingDay: formData.get('closingDay'),
    dueDay: formData.get('dueDay'),
    lastFour: lastFour && String(lastFour).trim() ? String(lastFour).replace(/\D/g, '').slice(-4) : null,
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const existing = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: tServer('cardNotFound') }

  const newTotal = parsed.data.totalLimit
  const delta = newTotal - existing.totalLimit
  const newAvail = Math.min(
    Math.max(0, roundMoney(existing.limit + delta)),
    newTotal,
  )

  await prisma.creditCard.update({
    where: { id },
    data: {
      name: parsed.data.name,
      totalLimit: newTotal,
      limit: newAvail,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  await revalidateLocalePaths(['/dashboard/cartao-credito'])
  return { success: true }
}

export async function payCreditCardFromBalance(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const paySchema = buildPaySchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = paySchema.safeParse({
    creditCardId: formData.get('creditCardId'),
    amount: formData.get('amount'),
    date: formData.get('date'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const card = await prisma.creditCard.findFirst({
    where: { id: parsed.data.creditCardId, userId: session.user.id },
  })
  if (!card) return { error: tServer('cardNotFound') }

  const locale = (await getLocale()) as AppLocale
  const currency = await getCurrentCurrency()

  const used = roundMoney(card.totalLimit - card.limit)
  const amount = roundMoney(parsed.data.amount)
  if (used <= 1e-6) return { error: tServer('noInvoiceToPay') }
  if (amount > used + 1e-6) {
    return {
      error: tServer('maxPayment', {
        amount: formatCurrency(used, locale, currency),
      }),
    }
  }

  const payDate = new Date(parsed.data.date)
  const cashAvail = await getAvailableCashForMonth(
    session.user.id,
    payDate.getMonth(),
    payDate.getFullYear(),
  )
  if (amount > cashAvail + 1e-6) {
    return {
      error: tServer('insufficientCash', {
        amount: formatCurrency(cashAvail, locale, currency),
      }),
    }
  }

  // 1. Tenta encontrar a categoria "Cartão de crédito"
  let category = await prisma.category.findFirst({
    where: {
      type: 'expense',
      isFixed: false,
      name: 'Fatura cartao de credito',
      OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
    },
  })
  // 2. Fallback: primeira categoria variável (comportamento atual)
  if (!category) {
    category = await prisma.category.findFirst({
      where: {
        type: 'expense',
        isFixed: false,
        OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
      },
      orderBy: { name: 'asc' },
    })
  }
  if (!category) {
    return { error: tServer('variableCategoryRequired') }
  }

  const newLimit = Math.min(card.totalLimit, roundMoney(card.limit + amount))
  const invoiceDescription = tServer('invoicePayment', { cardName: card.name })

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: category.id,
        amount,
        description: invoiceDescription,
        date: payDate,
        type: 'expense',
        paysCreditCardId: card.id,
      },
    })
    await tx.creditCard.update({
      where: { id: card.id },
      data: { limit: newLimit },
    })
  })

  await revalidateLocalePaths(CREDIT_CARD_PATHS)
  return { success: true }
}

export async function deleteCreditCard(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  const existing = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: tServer('cardNotFound') }

  await prisma.creditCard.delete({ where: { id } })

  await revalidateLocalePaths(['/dashboard/cartao-credito'])
  return { success: true }
}
