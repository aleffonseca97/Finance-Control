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
  amount: number
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

  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  const [payments, incomeAgg] = await Promise.all([
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
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'income',
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ])

  const rows: RecurringPaymentRow[] = payments.map((p) => {
    const occ = p.occurrences[0]
    return {
      id: p.id,
      amount: p.amount,
      categoryName: p.category.name,
      categoryGroup: p.category.group,
      paid: occ?.transactionId != null,
    }
  })

  const totalRecurring = payments.reduce((s, p) => s + p.amount, 0)
  const totalIncome = incomeAgg._sum.amount ?? 0
  const health = buildHealthInsight(totalRecurring, totalIncome)

  return { rows, totalRecurring, totalIncome, health }
}

export async function createRecurringPayment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = recurringPaymentCreateSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amount: formData.get('amount'),
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

  await prisma.recurringPayment.create({
    data: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
    },
  })

  await ensureOccurrencesForMonth(
    session.user.id,
    parsed.data.month,
    parsed.data.year,
  )

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

  await prisma.$transaction(async (db) => {
    const created = await db.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: payment.categoryId,
        amount: payment.amount,
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

  const deleted = await prisma.recurringPayment.deleteMany({
    where: { id, userId: session.user.id },
  })

  if (deleted.count === 0) return { error: 'Item não encontrado' }

  revalidateRecurringPaths()
  return { success: true }
}
