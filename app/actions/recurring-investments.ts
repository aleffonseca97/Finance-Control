'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRecurringInvestmentCreateSchema } from '@/lib/validations'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'

const RECURRING_INVESTMENT_PATHS = [
  '/dashboard/pagamentos-recorrentes',
  '/dashboard/recorrencia/investimentos',
  '/dashboard/investimentos',
  '/dashboard/analise',
  '/dashboard',
]

async function revalidateRecurringInvestmentPaths() {
  await revalidateLocalePaths(RECURRING_INVESTMENT_PATHS)
}

async function getMonthlyIncome(userId: string, month: number, year: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const incomeAgg = await prisma.transaction.aggregate({
    where: { userId, type: 'income', date: { gte: start, lte: end } },
    _sum: { amount: true },
  })
  return incomeAgg._sum.amount ?? 0
}

export type RecurringInvestmentRow = {
  id: string
  reserveCategoryId: string
  walletCategoryId: string
  reserveName: string
  walletName: string
  amount: number
  amountType: 'fixed' | 'percentage'
  percentage: number | null
  applied: boolean
}

export async function ensureRecurringInvestmentOccurrencesForMonth(
  userId: string,
  month: number,
  year: number,
) {
  const templates = await prisma.recurringInvestment.findMany({
    where: { userId },
    select: { id: true },
  })
  for (const t of templates) {
    await prisma.recurringInvestmentOccurrence.upsert({
      where: {
        recurringInvestmentId_year_month: {
          recurringInvestmentId: t.id,
          year,
          month,
        },
      },
      create: {
        recurringInvestmentId: t.id,
        year,
        month,
      },
      update: {},
    })
  }
}

export async function getRecurringInvestmentsForMonth(month: number, year: number) {
  const session = await auth()
  if (!session?.user?.id) return null

  await ensureRecurringInvestmentOccurrencesForMonth(session.user.id, month, year)
  const monthlyIncome = await getMonthlyIncome(session.user.id, month, year)
  const templates = await prisma.recurringInvestment.findMany({
    where: { userId: session.user.id },
    include: {
      reserveCategory: true,
      walletCategory: true,
      occurrences: {
        where: { month, year },
        take: 1,
      },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
  })

  const rows: RecurringInvestmentRow[] = templates.map((item) => ({
    id: item.id,
    reserveCategoryId: item.reserveCategoryId,
    walletCategoryId: item.walletCategoryId,
    reserveName: item.reserveCategory.name,
    walletName: item.walletCategory.name,
    amount:
      item.amountType === 'percentage'
        ? (monthlyIncome * (item.percentage ?? 0)) / 100
        : item.amount,
    amountType: item.amountType as 'fixed' | 'percentage',
    percentage: item.percentage,
    applied: item.occurrences[0]?.investmentId != null,
  }))

  return {
    rows,
    totalRecurring: rows.reduce((sum, row) => sum + row.amount, 0),
  }
}

export async function createRecurringInvestment(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tValidation = await getValidationTranslations()
  const recurringInvestmentCreateSchema = createRecurringInvestmentCreateSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = recurringInvestmentCreateSchema.safeParse({
    reserveCategoryId: formData.get('reserveCategoryId'),
    walletCategoryId: formData.get('walletCategoryId'),
    amountType: formData.get('amountType'),
    amount: formData.get('amount'),
    percentage: formData.get('percentage'),
    month: formData.get('month'),
    year: formData.get('year'),
  })
  if (!parsed.success) return { error: parsed.error.errors[0].message }

  await prisma.recurringInvestment.create({
    data: {
      userId: session.user.id,
      reserveCategoryId: parsed.data.reserveCategoryId,
      walletCategoryId: parsed.data.walletCategoryId,
      amountType: parsed.data.amountType,
      amount: parsed.data.amountType === 'fixed' ? parsed.data.amount : 0,
      percentage: parsed.data.amountType === 'percentage' ? parsed.data.percentage ?? null : null,
    },
  })

  await ensureRecurringInvestmentOccurrencesForMonth(
    session.user.id,
    parsed.data.month,
    parsed.data.year,
  )
  await revalidateRecurringInvestmentPaths()
  return { success: true }
}

export async function markRecurringInvestmentApplied(
  recurringInvestmentId: string,
  month: number,
  year: number,
) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  const template = await prisma.recurringInvestment.findFirst({
    where: { id: recurringInvestmentId, userId: session.user.id },
    include: {
      occurrences: {
        where: { month, year },
        take: 1,
      },
    },
  })
  if (!template) return { error: tServer('recurringInvestmentNotFound') }

  let occurrence = template.occurrences[0]
  if (!occurrence) {
    await ensureRecurringInvestmentOccurrencesForMonth(session.user.id, month, year)
    occurrence = await prisma.recurringInvestmentOccurrence.findFirst({
      where: { recurringInvestmentId, month, year },
    })
  }
  if (!occurrence) return { error: tServer('couldNotRegisterMonthShort') }
  if (occurrence.investmentId) return { success: true }

  const monthlyIncome = await getMonthlyIncome(session.user.id, month, year)
  const amount =
    template.amountType === 'percentage'
      ? (monthlyIncome * (template.percentage ?? 0)) / 100
      : template.amount
  if (amount <= 0) return { error: tServer('calculatedAmountZero') }

  const recurringNotes = tServer('recurringPayment')

  await prisma.$transaction(async (db) => {
    const created = await db.investment.create({
      data: {
        userId: session.user.id,
        reserveCategoryId: template.reserveCategoryId,
        walletCategoryId: template.walletCategoryId,
        amount,
        affectsCash: true,
        date: new Date(year, month, 1),
        notes: recurringNotes,
      },
    })

    await db.recurringInvestmentOccurrence.update({
      where: { id: occurrence!.id },
      data: { investmentId: created.id },
    })
  })

  revalidateRecurringInvestmentPaths()
  return { success: true }
}

export async function deleteRecurringInvestment(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  await prisma.recurringInvestment.deleteMany({
    where: { id, userId: session.user.id },
  })
  revalidateRecurringInvestmentPaths()
  return { success: true }
}
