'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createRecurringPaymentCreateSchema } from '@/lib/validations'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import { getTranslations } from 'next-intl/server'

const RECURRING_PATHS = [
  '/dashboard/pagamentos-recorrentes',
  '/dashboard',
  '/dashboard/saidas',
  '/dashboard/analise',
  '/dashboard/assinaturas',
]

async function revalidateRecurringPaths() {
  await revalidateLocalePaths(RECURRING_PATHS)
}

async function ensureExpenseCategoryForUser(categoryId: string, userId: string) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      type: 'expense',
      OR: [{ userId: null, isCustom: false }, { userId, isCustom: true }],
    },
  })
}

export async function ensureOccurrencesForMonth(
  userId: string,
  month: number,
  year: number,
) {
  const templates = await prisma.recurringPayment.findMany({
    where: { userId },
    select: { id: true },
  })

  for (const t of templates) {
    await prisma.recurringPaymentOccurrence.upsert({
      where: {
        recurringPaymentId_year_month: {
          recurringPaymentId: t.id,
          year,
          month,
        },
      },
      create: {
        recurringPaymentId: t.id,
        year,
        month,
      },
      update: {},
    })
  }
}

export type RecurringPaymentRow = {
  id: string
  categoryId: string
  amount: number
  amountType: 'fixed' | 'percentage'
  percentage: number | null
  categoryName: string
  categoryGroup: string | null
  paid: boolean
}

export type RecurringHealthInsight = {
  variant: 'neutral' | 'concern' | 'attention' | 'success'
  message: string
}

async function buildHealthInsight(
  totalRecurring: number,
  totalIncome: number,
): Promise<RecurringHealthInsight> {
  const t = await getTranslations('dashboard.recurringPayments.health')
  if (totalIncome <= 0) {
    return {
      variant: 'neutral',
      message: t('neutral'),
    }
  }
  const ratio = totalRecurring / totalIncome
  if (ratio >= 0.7) {
    return {
      variant: 'concern',
      message: t('concern'),
    }
  }
  if (ratio > 0.6) {
    return {
      variant: 'attention',
      message: t('attention'),
    }
  }
  return {
    variant: 'success',
    message: t('success'),
  }
}

async function getMonthlyIncome(userId: string, month: number, year: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999)
  const incomeAgg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: 'income',
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  })
  return incomeAgg._sum.amount ?? 0
}

export async function getRecurringPaymentsForMonth(
  month: number,
  year: number,
): Promise<{
  rows: RecurringPaymentRow[]
  totalRecurring: number
  totalIncome: number
  health: RecurringHealthInsight
} | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  await ensureOccurrencesForMonth(userId, month, year)

  const [payments, totalIncome] = await Promise.all([
    prisma.recurringPayment.findMany({
      where: { userId },
      include: {
        category: true,
        occurrences: {
          where: { year, month },
          take: 1,
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    }),
    getMonthlyIncome(userId, month, year),
  ])

  const rows: RecurringPaymentRow[] = payments.map((p) => {
    const occ = p.occurrences[0]
    const effectiveAmount =
      p.amountType === 'percentage'
        ? (Math.max(0, totalIncome) * (p.percentage ?? 0)) / 100
        : p.amount
    return {
      id: p.id,
      categoryId: p.categoryId,
      amount: effectiveAmount,
      amountType: p.amountType as 'fixed' | 'percentage',
      percentage: p.percentage,
      categoryName: p.category.name,
      categoryGroup: p.category.group,
      paid: occ?.transactionId != null,
    }
  })

  const totalRecurring = rows.reduce((s, p) => s + p.amount, 0)
  const health = await buildHealthInsight(totalRecurring, totalIncome)

  return { rows, totalRecurring, totalIncome, health }
}

export async function createRecurringPayment(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const recurringPaymentCreateSchema = createRecurringPaymentCreateSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = recurringPaymentCreateSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amountType: formData.get('amountType'),
    amount: formData.get('amount'),
    percentage: formData.get('percentage'),
    month: formData.get('month'),
    year: formData.get('year'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const category = await ensureExpenseCategoryForUser(
    parsed.data.categoryId,
    session.user.id,
  )
  if (!category) return { error: tServer('invalidCategory') }

  await prisma.$transaction(async (db) => {
    await db.recurringPayment.create({
      data: {
        userId: session.user.id,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        amountType: parsed.data.amountType,
        percentage: parsed.data.amountType === 'percentage' ? parsed.data.percentage ?? null : null,
      },
    })

    await db.category.update({
      where: { id: parsed.data.categoryId },
      data: {
        isFixed: true,
        defaultValue: parsed.data.amountType === 'fixed' ? parsed.data.amount : null,
      },
    })
  })

  await ensureOccurrencesForMonth(
    session.user.id,
    parsed.data.month,
    parsed.data.year,
  )

  await revalidateRecurringPaths()
  return { success: true }
}

export async function updateRecurringPayment(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const recurringPaymentCreateSchema = createRecurringPaymentCreateSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const recurringPaymentIdRaw = formData.get('recurringPaymentId')
  const recurringPaymentId =
    typeof recurringPaymentIdRaw === 'string' ? recurringPaymentIdRaw.trim() : ''
  if (!recurringPaymentId) return { error: tServer('invalidRecurringPayment') }

  const parsed = recurringPaymentCreateSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amountType: formData.get('amountType'),
    amount: formData.get('amount'),
    percentage: formData.get('percentage'),
    month: formData.get('month'),
    year: formData.get('year'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const nextCategory = await ensureExpenseCategoryForUser(
    parsed.data.categoryId,
    session.user.id,
  )
  if (!nextCategory) return { error: tServer('invalidCategory') }

  const existing = await prisma.recurringPayment.findFirst({
    where: { id: recurringPaymentId, userId: session.user.id },
    include: {
      occurrences: {
        where: { year: parsed.data.year, month: parsed.data.month },
        take: 1,
      },
    },
  })

  if (!existing) return { error: tServer('recurringPaymentNotFound') }
  const recurringDescription = tServer('recurringPayment')
  const now = new Date()
  const isCurrentMonth =
    parsed.data.month === now.getMonth() && parsed.data.year === now.getFullYear()
  const monthlyForCurrentLaunch =
    isCurrentMonth && existing.occurrences[0]?.transactionId
      ? await getMonthlyIncome(session.user.id, parsed.data.month, parsed.data.year)
      : null

  await prisma.$transaction(async (db) => {
    await db.recurringPayment.update({
      where: { id: existing.id },
      data: {
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        amountType: parsed.data.amountType,
        percentage: parsed.data.amountType === 'percentage' ? parsed.data.percentage ?? null : null,
      },
    })

    await db.category.update({
      where: { id: parsed.data.categoryId },
      data: {
        isFixed: true,
        defaultValue: parsed.data.amountType === 'fixed' ? parsed.data.amount : null,
      },
    })

    if (existing.categoryId !== parsed.data.categoryId) {
      const previousCategoryTemplates = await db.recurringPayment.findMany({
        where: { userId: session.user.id, categoryId: existing.categoryId },
        select: { amount: true, amountType: true },
        orderBy: { createdAt: 'asc' },
      })

      if (previousCategoryTemplates.length === 0) {
        await db.category.update({
          where: { id: existing.categoryId },
          data: { isFixed: false, defaultValue: null },
        })
      } else {
        const latestTemplate =
          previousCategoryTemplates[previousCategoryTemplates.length - 1]!
        await db.category.update({
          where: { id: existing.categoryId },
          data: {
            isFixed: true,
            defaultValue:
              latestTemplate.amountType === 'fixed' ? latestTemplate.amount : null,
          },
        })
      }
    }

    const occurrence = existing.occurrences[0]
    if (isCurrentMonth && occurrence?.transactionId) {
      const nextAmount =
        parsed.data.amountType === 'percentage'
          ? ((monthlyForCurrentLaunch ?? 0) * (parsed.data.percentage ?? 0)) / 100
          : parsed.data.amount
      await db.transaction.update({
        where: { id: occurrence.transactionId },
        data: {
          categoryId: parsed.data.categoryId,
          amount: nextAmount,
          description: recurringDescription,
        },
      })
    }
  })

  revalidateRecurringPaths()
  return { success: true }
}

export async function markRecurringPaymentPaid(
  recurringPaymentId: string,
  month: number,
  year: number,
) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  const payment = await prisma.recurringPayment.findFirst({
    where: { id: recurringPaymentId, userId: session.user.id },
    include: {
      occurrences: {
        where: { year, month },
        take: 1,
      },
    },
  })

  if (!payment) return { error: tServer('recurringPaymentNotFound') }

  let occ = payment.occurrences[0]
  if (!occ) {
    await ensureOccurrencesForMonth(session.user.id, month, year)
    occ = await prisma.recurringPaymentOccurrence.findFirst({
      where: { recurringPaymentId, year, month },
    })
    if (!occ) return { error: tServer('couldNotRegisterMonth') }
  }

  if (occ.transactionId) {
    return { success: true }
  }

  const txDate = new Date(year, month, 1)
  const monthlyIncome = await getMonthlyIncome(session.user.id, month, year)
  const amountToLaunch =
    payment.amountType === 'percentage'
      ? (monthlyIncome * (payment.percentage ?? 0)) / 100
      : payment.amount

  const recurringDescription = tServer('recurringPayment')

  await prisma.$transaction(async (db) => {
    const created = await db.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: payment.categoryId,
        amount: amountToLaunch,
        description: recurringDescription,
        date: txDate,
        type: 'expense',
        creditCardId: null,
      },
    })

    await db.recurringPaymentOccurrence.update({
      where: { id: occ!.id },
      data: { transactionId: created.id },
    })
  })

  revalidateRecurringPaths()
  return { success: true }
}

export async function deleteRecurringPayment(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  const existing = await prisma.recurringPayment.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, categoryId: true },
  })
  if (!existing) return { error: tServer('itemNotFound') }

  await prisma.$transaction(async (db) => {
    await db.recurringPayment.delete({
      where: { id: existing.id },
    })

    const remainingForCategory = await db.recurringPayment.findMany({
      where: { userId: session.user.id, categoryId: existing.categoryId },
      select: { amount: true },
      orderBy: { createdAt: 'asc' },
    })

    if (remainingForCategory.length === 0) {
      await db.category.update({
        where: { id: existing.categoryId },
        data: { isFixed: false, defaultValue: null },
      })
    } else {
      const latestAmount =
        remainingForCategory[remainingForCategory.length - 1]!.amount
      await db.category.update({
        where: { id: existing.categoryId },
        data: { isFixed: true, defaultValue: latestAmount },
      })
    }
  })

  revalidateRecurringPaths()
  return { success: true }
}
