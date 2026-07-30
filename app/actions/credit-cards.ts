'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureGlobalCategories } from '@/app/actions/categories'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import {
  countRemainingDueInYear,
  monthlyTotalsRemainingInYear,
  remainingAmountInYear,
} from '@/lib/installment-schedule'
import { roundMoney } from '@/lib/credit-card-billing'

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

export type CreditCardWithMonthUsage = {
  id: string
  userId: string
  name: string
  lastFour: string | null
  limit: number
  totalLimit: number
  closingDay: number
  dueDay: number
  color: string | null
  monthSpent: number
  usagePct: number
}

export type CreditCardInstallmentRow = {
  id: string
  creditCardId: string
  creditCardName: string
  creditCardLastFour: string | null
  creditCardColor: string | null
  name: string
  monthlyAmount: number
  totalInstallments: number
  paidInstallments: number
  firstInstallmentDate: string
  notes: string | null
  remainingInstallments: number
  remainingAmount: number
  remainingDueInYear: number
  remainingAmountInYear: number
}

export type CreditCardPagePayload = {
  cards: CreditCardWithMonthUsage[]
  month: number
  year: number
  monthSpentTotal: number
  totalLimitSum: number
  activeMonthlyCommitment: number
  totalRemainingInYear: number
  installmentPlans: CreditCardInstallmentRow[]
  creditCardCategorySpending: { name: string; value: number; color: string | null }[]
}

export async function getCreditCardPagePayload(): Promise<CreditCardPagePayload | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  await ensureGlobalCategories()

  const now = new Date()
  const month = now.getMonth()
  const year = now.getFullYear()
  const startOfMonth = new Date(year, month, 1)
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999)

  const [cardsRaw, monthCharges, creditCardCategorySpendingRaw, installmentRaw] =
    await Promise.all([
      prisma.creditCard.findMany({
        where: { userId: session.user.id },
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.groupBy({
        by: ['creditCardId'],
        where: {
          userId: session.user.id,
          type: 'expense',
          creditCardId: { not: null },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.findMany({
        where: {
          userId: session.user.id,
          type: 'expense',
          creditCardId: { not: null },
          date: { gte: startOfMonth, lte: endOfMonth },
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
      prisma.installmentPlan.findMany({
        where: {
          userId: session.user.id,
          creditCardId: { not: null },
          kind: 'CREDIT_CARD',
        },
        include: {
          creditCard: {
            select: { id: true, name: true, lastFour: true, color: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

  const spentByCard = new Map<string, number>()
  for (const row of monthCharges) {
    if (row.creditCardId) {
      spentByCard.set(row.creditCardId, roundMoney(row._sum.amount ?? 0))
    }
  }

  const cards: CreditCardWithMonthUsage[] = cardsRaw.map((card) => {
    const monthSpent = spentByCard.get(card.id) ?? 0
    const totalLimit = card.totalLimit
    const usagePct =
      totalLimit > 0 ? Math.min(100, (monthSpent / totalLimit) * 100) : 0
    return {
      ...card,
      monthSpent,
      usagePct,
    }
  })

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

  const installmentPlans: CreditCardInstallmentRow[] = installmentRaw
    .filter((p) => p.creditCardId && p.creditCard)
    .map((p) => {
      const remainingInstallments = Math.max(0, p.totalInstallments - p.paidInstallments)
      return {
        id: p.id,
        creditCardId: p.creditCardId!,
        creditCardName: p.creditCard!.name,
        creditCardLastFour: p.creditCard!.lastFour,
        creditCardColor: p.creditCard!.color,
        name: p.name,
        monthlyAmount: p.monthlyAmount,
        totalInstallments: p.totalInstallments,
        paidInstallments: p.paidInstallments,
        firstInstallmentDate: p.firstInstallmentDate.toISOString().slice(0, 10),
        notes: p.notes,
        remainingInstallments,
        remainingAmount: roundMoney(remainingInstallments * p.monthlyAmount),
        remainingDueInYear: countRemainingDueInYear(
          p.firstInstallmentDate,
          p.totalInstallments,
          p.paidInstallments,
          year,
        ),
        remainingAmountInYear: remainingAmountInYear(
          p.monthlyAmount,
          p.firstInstallmentDate,
          p.totalInstallments,
          p.paidInstallments,
          year,
        ),
      }
    })

  const activeMonthlyCommitment = roundMoney(
    installmentPlans
      .filter((p) => p.remainingInstallments > 0)
      .reduce((s, p) => s + p.monthlyAmount, 0),
  )

  const totalRemainingInYear = roundMoney(
    monthlyTotalsRemainingInYear(
      installmentRaw.map((p) => ({
        monthlyAmount: p.monthlyAmount,
        firstInstallmentDate: p.firstInstallmentDate,
        totalInstallments: p.totalInstallments,
        paidInstallments: p.paidInstallments,
      })),
      year,
    ).reduce((a, b) => a + b, 0),
  )

  const monthSpentTotal = roundMoney(cards.reduce((s, c) => s + c.monthSpent, 0))
  const totalLimitSum = roundMoney(cards.reduce((s, c) => s + c.totalLimit, 0))

  return {
    cards,
    month,
    year,
    monthSpentTotal,
    totalLimitSum,
    activeMonthlyCommitment,
    totalRemainingInYear,
    installmentPlans,
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
    lastFour:
      lastFour && String(lastFour).trim()
        ? String(lastFour).replace(/\D/g, '').slice(-4)
        : null,
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

  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard'])
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
    lastFour:
      lastFour && String(lastFour).trim()
        ? String(lastFour).replace(/\D/g, '').slice(-4)
        : null,
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

  await prisma.creditCard.update({
    where: { id },
    data: {
      name: parsed.data.name,
      totalLimit: newTotal,
      limit: newTotal,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard'])
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

  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard'])
  return { success: true }
}
