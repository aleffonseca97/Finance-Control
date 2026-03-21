'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { budgetExpenseWhere } from '@/lib/budget-expense'
import { MONTHS_SHORT } from '@/lib/constants'

export type AnalysisRow = {
  label: string
  income: number
  fixedExpense: number
  variableExpense: number
  balance: number
}

type RawRow = Omit<AnalysisRow, 'balance'>

type AnalysisTransaction = {
  type: string
  amount: number
  date: Date
  creditCardId: string | null
  paysCreditCardId: string | null
  category: { isFixed: boolean } | null
}

const ANALYSIS_SELECT = {
  type: true,
  amount: true,
  date: true,
  creditCardId: true,
  paysCreditCardId: true,
  category: { select: { isFixed: true } },
} as const

function addBalance(rows: RawRow[]): AnalysisRow[] {
  return rows.map((row) => ({
    ...row,
    balance: row.income - row.fixedExpense - row.variableExpense,
  }))
}

function classifyTransaction(t: AnalysisTransaction, row: RawRow) {
  if (t.type === 'income') {
    row.income += t.amount
    return
  }
  if (t.creditCardId || t.paysCreditCardId) return
  if (t.category?.isFixed) {
    row.fixedExpense += t.amount
  } else {
    row.variableExpense += t.amount
  }
}

function makeRow(label: string): RawRow {
  return { label, income: 0, fixedExpense: 0, variableExpense: 0 }
}

export async function getFixedVsVariable(month?: number, year?: number) {
  const session = await auth()
  if (!session?.user?.id) return { fixed: 0, variable: 0 }

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)

  const fixedCategories = await prisma.category.findMany({
    where: { userId: session.user.id, type: 'expense', isFixed: true },
    select: { id: true },
  })
  const variableCategories = await prisma.category.findMany({
    where: { userId: session.user.id, type: 'expense', isFixed: false },
    select: { id: true },
  })

  const [fixedAgg, variableAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        categoryId: { in: fixedCategories.map((c) => c.id) },
        date: { gte: start, lte: end },
        ...budgetExpenseWhere,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        categoryId: { in: variableCategories.map((c) => c.id) },
        date: { gte: start, lte: end },
        ...budgetExpenseWhere,
      },
      _sum: { amount: true },
    }),
  ])

  return {
    fixed: fixedAgg._sum.amount ?? 0,
    variable: variableAgg._sum.amount ?? 0,
  }
}

export async function getExpensesByCategory(
  month?: number,
  year?: number,
  limit = 5,
) {
  const session = await auth()
  if (!session?.user?.id) return []

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)

  const transactions = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
      ...budgetExpenseWhere,
    },
    _sum: { amount: true },
  })

  const categoryIds = transactions.map((t) => t.categoryId)
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  })
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]))

  return transactions
    .map((t) => ({
      name: categoryMap[t.categoryId]?.name ?? 'Outros',
      value: t._sum.amount ?? 0,
      color: categoryMap[t.categoryId]?.color ?? '#6366f1',
      icon: categoryMap[t.categoryId]?.icon ?? 'CreditCard',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
}

export async function getMonthComparison(month?: number, year?: number) {
  const session = await auth()
  if (!session?.user?.id)
    return {
      current: { income: 0, expense: 0 },
      previous: { income: 0, expense: 0 },
    }

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()

  const currentStart = new Date(y, m, 1)
  const currentEnd = new Date(y, m + 1, 0)
  const prevStart = new Date(y, m - 1, 1)
  const prevEnd = new Date(y, m, 0)

  const [currentIncome, currentExpense, prevIncome, prevExpense] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: session.user.id, type: 'income', date: { gte: currentStart, lte: currentEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.user.id, date: { gte: currentStart, lte: currentEnd }, ...budgetExpenseWhere },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.user.id, type: 'income', date: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: session.user.id, date: { gte: prevStart, lte: prevEnd }, ...budgetExpenseWhere },
        _sum: { amount: true },
      }),
    ])

  return {
    current: {
      income: currentIncome._sum.amount ?? 0,
      expense: currentExpense._sum.amount ?? 0,
    },
    previous: {
      income: prevIncome._sum.amount ?? 0,
      expense: prevExpense._sum.amount ?? 0,
    },
  }
}

export async function getDailyAnalysis(
  month?: number,
  year?: number,
): Promise<AnalysisRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()
  const daysInMonth = new Date(y, m + 1, 0).getDate()

  const rows = Array.from({ length: daysInMonth }, (_, i) => makeRow(String(i + 1)))

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: new Date(y, m, 1), lte: new Date(y, m + 1, 0, 23, 59, 59, 999) },
      type: { in: ['income', 'expense'] },
    },
    select: ANALYSIS_SELECT,
  })

  for (const t of transactions) {
    const day = parseInt(t.date.toISOString().slice(8, 10), 10)
    const idx = day - 1
    if (idx >= 0 && idx < rows.length) classifyTransaction(t, rows[idx])
  }

  return addBalance(rows)
}

export async function getMonthlyAnalysis(year?: number): Promise<AnalysisRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const y = year ?? new Date().getFullYear()
  const rows = MONTHS_SHORT.map((label) => makeRow(label))

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: new Date(y, 0, 1), lte: new Date(y, 11, 31, 23, 59, 59, 999) },
      type: { in: ['income', 'expense'] },
    },
    select: ANALYSIS_SELECT,
  })

  for (const t of transactions) {
    const monthIndex = t.date.getMonth()
    if (monthIndex >= 0 && monthIndex <= 11) classifyTransaction(t, rows[monthIndex])
  }

  return addBalance(rows)
}

export async function getAnnualAnalysis(yearsBack = 5): Promise<AnalysisRow[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const currentYear = new Date().getFullYear()
  const startYear = currentYear - Math.max(1, yearsBack) + 1

  const rowsByYear = new Map<number, RawRow>()
  for (let y = startYear; y <= currentYear; y++) {
    rowsByYear.set(y, makeRow(String(y)))
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(startYear, 0, 1),
        lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
      },
      type: { in: ['income', 'expense'] },
    },
    select: ANALYSIS_SELECT,
  })

  for (const t of transactions) {
    const row = rowsByYear.get(t.date.getFullYear())
    if (row) classifyTransaction(t, row)
  }

  return addBalance(Array.from(rowsByYear.values()))
}
