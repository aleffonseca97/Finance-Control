'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ensureUserCategories } from '@/app/actions/categories'
import { budgetExpenseWhere } from '@/lib/budget-expense'
import {
  serializeOverdueNotices,
  type CreditCardOverdueNotice,
} from '@/lib/credit-card-overdue'
import {
  allocatePaymentsFifo,
  billingCycleForClosingEnd,
  closedInvoiceBookingDate,
  dateOnlyInRange,
  isClosingDatePassed,
  isDueDatePassed,
  listClosingEndsOnOrBefore,
  normalizePeriodEndKey,
  roundMoney,
  startOfDay,
} from '@/lib/credit-card-billing'

export type { CreditCardOverdueNotice, SerializedCreditCardOverdue } from '@/lib/credit-card-overdue'

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  totalLimit: z.coerce.number().min(0, 'Limite deve ser positivo'),
  closingDay: z.coerce.number().min(1, 'Dia inválido').max(31, 'Dia inválido'),
  dueDay: z.coerce.number().min(1, 'Dia inválido').max(31, 'Dia inválido'),
  lastFour: z.string().max(4).optional().nullable(),
  color: z.string().optional(),
})

const paySchema = z.object({
  creditCardId: z.string().min(1),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
})

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
      where: { userId, date: { gte: start, lte: end } },
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

export async function ensureCreditCardClosedInvoices(userId: string) {
  await ensureUserCategories(userId)
  const today = new Date()
  const cards = await prisma.creditCard.findMany({ where: { userId } })
  if (cards.length === 0) return

  const variableCat = await prisma.category.findFirst({
    where: { userId, type: 'expense', isFixed: false },
    orderBy: { name: 'asc' },
  })
  if (!variableCat) return

  const [charges, payments] = await fetchChargesAndPayments(userId)

  for (const card of cards) {
    const { cyclesData, allocMap } = buildCyclesForCard(card, charges, payments, today)

    for (const c of cyclesData) {
      if (c.invoice <= 1e-6) continue
      if (!isClosingDatePassed(c.periodEnd, today)) continue

      const key = startOfDay(c.periodEnd).getTime()
      const toBook = roundMoney(c.invoice - (allocMap.get(key) ?? 0))
      if (toBook <= 1e-6) continue

      const periodEndKey = normalizePeriodEndKey(c.periodEnd)

      const exists = await prisma.transaction.findFirst({
        where: {
          userId,
          creditCarryoverCardId: card.id,
          creditCarryoverPeriodEnd: periodEndKey,
        },
      })
      if (exists) continue

      await prisma.transaction.create({
        data: {
          userId,
          categoryId: variableCat.id,
          amount: toBook,
          description: `Fatura fechada — ${card.name} (fech. ${periodEndKey.toLocaleDateString('pt-BR')})`,
          date: closedInvoiceBookingDate(c.periodEnd),
          type: 'expense',
          creditCarryoverCardId: card.id,
          creditCarryoverPeriodEnd: periodEndKey,
        },
      })
    }
  }

  revalidatePath('/dashboard/cartao-credito')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard')
}

export async function getCreditCardOverdueNotices(
  userId: string,
): Promise<CreditCardOverdueNotice[]> {
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
        closingLabel: normalizePeriodEndKey(c.periodEnd).toLocaleDateString('pt-BR'),
      })
    }
  }

  return notices
}

export async function getCreditCardPagePayload() {
  const session = await auth()
  if (!session?.user?.id) return null

  await ensureUserCategories(session.user.id)
  await ensureCreditCardClosedInvoices(session.user.id)

  const now = new Date()
  const [cards, availableCash, overdueRaw] = await Promise.all([
    prisma.creditCard.findMany({
      where: { userId: session.user.id },
      orderBy: { name: 'asc' },
    }),
    getAvailableCashForMonth(session.user.id, now.getMonth(), now.getFullYear()),
    getCreditCardOverdueNotices(session.user.id),
  ])

  return {
    cards,
    availableCash,
    month: now.getMonth(),
    year: now.getFullYear(),
    overdueNotices: serializeOverdueNotices(overdueRaw),
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
  if (!session?.user?.id) return { error: 'Não autorizado' }

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

  const t = parsed.data.totalLimit
  await prisma.creditCard.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      totalLimit: t,
      limit: t,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}

export async function updateCreditCard(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

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

  if (!existing) return { error: 'Cartão não encontrado' }

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

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}

export async function payCreditCardFromBalance(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

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
  if (!card) return { error: 'Cartão não encontrado' }

  const used = roundMoney(card.totalLimit - card.limit)
  const amount = roundMoney(parsed.data.amount)
  if (used <= 1e-6) return { error: 'Não há fatura a pagar neste cartão' }
  if (amount > used + 1e-6) {
    return { error: `Máximo a pagar: R$ ${used.toFixed(2).replace('.', ',')}` }
  }

  const payDate = new Date(parsed.data.date)
  const cashAvail = await getAvailableCashForMonth(
    session.user.id,
    payDate.getMonth(),
    payDate.getFullYear(),
  )
  if (amount > cashAvail + 1e-6) {
    return {
      error: `Saldo em caixa do mês insuficiente (disponível: R$ ${cashAvail.toFixed(2).replace('.', ',')})`,
    }
  }

  // 1. Tenta encontrar a categoria "Cartão de crédito"
  let category = await prisma.category.findFirst({
    where: {
      userId: session.user.id,
      type: 'expense',
      isFixed: false,
      name: 'Cartão de crédito',
    },
  })
  // 2. Fallback: primeira categoria variável (comportamento atual)
  if (!category) {
    category = await prisma.category.findFirst({
      where: { userId: session.user.id, type: 'expense', isFixed: false },
      orderBy: { name: 'asc' },
    })
  }
  if (!category) {
    return { error: 'Cadastre uma categoria de despesa variável em Configurações' }
  }

  const newLimit = Math.min(card.totalLimit, roundMoney(card.limit + amount))

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: category.id,
        amount,
        description: `Pagamento fatura (caixa) — ${card.name}`,
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

  revalidatePath('/dashboard/cartao-credito')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/analise')
  return { success: true }
}

export async function deleteCreditCard(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const existing = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: 'Cartão não encontrado' }

  await prisma.creditCard.delete({ where: { id } })

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}
