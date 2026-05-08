'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { recurringPaymentCreateSchema } from '@/lib/validations'

const RECURRING_TX_DESCRIPTION = 'Pagamento recorrente'

function revalidateRecurringPaths() {
  revalidatePath('/dashboard/pagamentos-recorrentes')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/analise')
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

function buildHealthInsight(
  totalRecurring: number,
  totalIncome: number,
): RecurringHealthInsight {
  if (totalIncome <= 0) {
    return {
      variant: 'neutral',
      message:
        'Cadastre suas entradas neste mês para comparar com o total das contas recorrentes e receber uma leitura da saúde financeira.',
    }
  }
  const ratio = totalRecurring / totalIncome
  if (ratio >= 0.7) {
    return {
      variant: 'concern',
      message:
        'Suas contas recorrentes consomem 70% ou mais das suas entradas. Vale revisar gastos e reservas para não comprometer o equilíbrio financeiro.',
    }
  }
  if (ratio > 0.6) {
    return {
      variant: 'attention',
      message:
        'Suas contas recorrentes estão entre 60% e 70% das entradas. Acompanhe de perto para manter folga no orçamento.',
    }
  }
  return {
    variant: 'success',
    message:
      'Parabéns: suas contas recorrentes representam até 60% das entradas. Você mantém boa margem para imprevistos e objetivos.',
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
  const health = buildHealthInsight(totalRecurring, totalIncome)

  return { rows, totalRecurring, totalIncome, health }
}

export async function createRecurringPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

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
  if (!category) return { error: 'Categoria inválida' }

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

  revalidateRecurringPaths()
  return { success: true }
}

export async function updateRecurringPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const recurringPaymentIdRaw = formData.get('recurringPaymentId')
  const recurringPaymentId =
    typeof recurringPaymentIdRaw === 'string' ? recurringPaymentIdRaw.trim() : ''
  if (!recurringPaymentId) return { error: 'Pagamento recorrente inválido' }

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
  if (!nextCategory) return { error: 'Categoria inválida' }

  const existing = await prisma.recurringPayment.findFirst({
    where: { id: recurringPaymentId, userId: session.user.id },
    include: {
      occurrences: {
        where: { year: parsed.data.year, month: parsed.data.month },
        take: 1,
      },
    },
  })

  if (!existing) return { error: 'Pagamento recorrente não encontrado' }
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
          description: RECURRING_TX_DESCRIPTION,
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
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const payment = await prisma.recurringPayment.findFirst({
    where: { id: recurringPaymentId, userId: session.user.id },
    include: {
      occurrences: {
        where: { year, month },
        take: 1,
      },
    },
  })

  if (!payment) return { error: 'Pagamento recorrente não encontrado' }

  let occ = payment.occurrences[0]
  if (!occ) {
    await ensureOccurrencesForMonth(session.user.id, month, year)
    occ = await prisma.recurringPaymentOccurrence.findFirst({
      where: { recurringPaymentId, year, month },
    })
    if (!occ) return { error: 'Não foi possível registrar o mês para este item.' }
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

  await prisma.$transaction(async (db) => {
    const created = await db.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: payment.categoryId,
        amount: amountToLaunch,
        description: RECURRING_TX_DESCRIPTION,
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
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const existing = await prisma.recurringPayment.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, categoryId: true },
  })
  if (!existing) return { error: 'Item não encontrado' }

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
