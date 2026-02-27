'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function getLastTransactions(limit = 10, excludeCreditCard = false) {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      ...(excludeCreditCard && {
        OR: [
          { type: 'income' },
          { type: 'expense', creditCardId: null },
        ],
      }),
    },
    include: { category: true },
    orderBy: { date: 'desc' },
    take: limit,
  })
}

export async function getMonthlyEvolution(months = 6) {
  const session = await auth()
  if (!session?.user?.id) return []

  const now = new Date()
  const result: { month: string; income: number; expense: number; investment: number }[] = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)

    const [income, expense, investment] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: session.user.id, type: 'income', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.user.id, type: 'expense', date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
      prisma.investment.aggregate({
        where: { userId: session.user.id, date: { gte: start, lte: end } },
        _sum: { amount: true },
      }),
    ])

    result.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      income: income._sum.amount ?? 0,
      expense: expense._sum.amount ?? 0,
      investment: investment._sum.amount ?? 0,
    })
  }

  return result
}
