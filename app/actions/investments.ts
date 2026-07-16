'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  createInvestmentSchema,
  createWithdrawalSchema,
} from '@/lib/validations'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import type { Category } from '@prisma/client'

const INVESTMENT_PATHS = [
  '/dashboard',
  '/dashboard/investimentos',
  '/dashboard/metas',
  '/dashboard/analise',
]

export async function createInvestment(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const investmentSchema = createInvestmentSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = investmentSchema.safeParse({
    reserveCategoryId: formData.get('reserveCategoryId'),
    walletCategoryId: formData.get('walletCategoryId'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    notes: formData.get('notes'),
    useBalance: formData.get('useBalance'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const [reserveCat, walletCat] = await Promise.all([
    prisma.category.findFirst({
      where: {
        id: parsed.data.reserveCategoryId,
        type: 'investment',
        investmentSubtype: 'reserva',
        OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
      },
    }),
    prisma.category.findFirst({
      where: {
        id: parsed.data.walletCategoryId,
        type: 'investment',
        investmentSubtype: 'carteira',
        OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
      },
    }),
  ])

  if (!reserveCat) return { error: tServer('invalidReserve') }
  if (!walletCat) return { error: tServer('invalidWallet') }

  await prisma.investment.create({
    data: {
      userId: session.user.id,
      reserveCategoryId: parsed.data.reserveCategoryId,
      walletCategoryId: parsed.data.walletCategoryId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes || null,
      affectsCash: parsed.data.useBalance,
    },
  })

  await revalidateLocalePaths(INVESTMENT_PATHS)
  return { success: true }
}

export async function createWithdrawal(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const withdrawalSchema = createWithdrawalSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = withdrawalSchema.safeParse({
    reserveCategoryId: formData.get('reserveCategoryId'),
    walletCategoryId: formData.get('walletCategoryId'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const balance = await getBalanceByReserveWallet(
    session.user.id,
    parsed.data.reserveCategoryId,
    parsed.data.walletCategoryId
  )
  if (balance < parsed.data.amount) {
    return { error: tServer('insufficientBalance') }
  }

  await prisma.investment.create({
    data: {
      userId: session.user.id,
      reserveCategoryId: parsed.data.reserveCategoryId,
      walletCategoryId: parsed.data.walletCategoryId,
      amount: -parsed.data.amount,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes || null,
      affectsCash: true,
    },
  })

  await revalidateLocalePaths(INVESTMENT_PATHS)
  return { success: true }
}

export async function getBalanceByReserveWallet(
  userId: string,
  reserveCategoryId: string,
  walletCategoryId: string
): Promise<number> {
  const result = await prisma.investment.aggregate({
    where: {
      userId,
      reserveCategoryId,
      walletCategoryId,
    },
    _sum: { amount: true },
  })
  return result._sum.amount ?? 0
}

export type ReserveWalletBalance = {
  reserveCategory: Category
  walletCategory: Category
  balance: number
}

export async function getReserveWalletBalancesForUser(): Promise<ReserveWalletBalance[]> {
  const session = await auth()
  if (!session?.user?.id) return []
  return getAllReserveWalletBalances(session.user.id)
}

export async function getAllReserveWalletBalances(
  userId: string
): Promise<ReserveWalletBalance[]> {
  const investments = await prisma.investment.findMany({
    where: {
      userId,
      reserveCategoryId: { not: null },
      walletCategoryId: { not: null },
    },
    select: {
      reserveCategoryId: true,
      walletCategoryId: true,
      amount: true,
    },
  })

  const balanceMap = new Map<string, number>()
  const categoryIds = new Set<string>()
  for (const inv of investments) {
    if (inv.reserveCategoryId && inv.walletCategoryId) {
      const key = `${inv.reserveCategoryId}:${inv.walletCategoryId}`
      balanceMap.set(key, (balanceMap.get(key) ?? 0) + inv.amount)
      categoryIds.add(inv.reserveCategoryId)
      categoryIds.add(inv.walletCategoryId)
    }
  }

  const categories = await prisma.category.findMany({
    where: { id: { in: Array.from(categoryIds) } },
  })
  const categoriesById = new Map(categories.map((c) => [c.id, c]))

  const result: ReserveWalletBalance[] = []
  for (const [key, balance] of Array.from(balanceMap.entries())) {
    if (balance <= 0) continue
    const [reserveId, walletId] = key.split(':')
    const reserve = categoriesById.get(reserveId)
    const wallet = categoriesById.get(walletId)
    if (reserve && wallet) {
      result.push({ reserveCategory: reserve, walletCategory: wallet, balance })
    }
  }
  result.sort((a, b) => b.balance - a.balance)
  return result
}

export async function deleteInvestment(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()
  if (!session?.user?.id) return { error: t('unauthorized') }

  await prisma.investment.deleteMany({
    where: { id, userId: session.user.id },
  })

  await revalidateLocalePaths(INVESTMENT_PATHS)
  return { success: true }
}

export async function getInvestments(month?: number, year?: number) {
  const session = await auth()
  if (!session?.user?.id) return { investments: [], total: 0 }

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)

  const [investments, agg] = await Promise.all([
    prisma.investment.findMany({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      include: { category: true, reserveCategory: true, walletCategory: true },
      orderBy: { date: 'desc' },
    }),
    prisma.investment.aggregate({
      where: { userId: session.user.id, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ])

  return {
    investments,
    total: agg._sum.amount ?? 0,
  }
}

type InvestmentSummaryItem = {
  category: Category
  total: number
  /** For new structure: reserve + wallet label */
  label?: string
}

export async function getInvestmentsSummary(): Promise<{
  total: number
  items: InvestmentSummaryItem[]
  byReserve: { category: Category; total: number }[]
  byWallet: { category: Category; total: number }[]
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { total: 0, items: [], byReserve: [], byWallet: [] }
  }

  const investments = await prisma.investment.findMany({
    where: { userId: session.user.id },
    select: {
      reserveCategoryId: true,
      walletCategoryId: true,
      categoryId: true,
      amount: true,
    },
  })

  const categories = await prisma.category.findMany({
    where: {
      type: 'investment',
      OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
    },
  })
  const categoriesById = new Map(categories.map((c) => [c.id, c]))

  const reserveTotals = new Map<string, number>()
  const walletTotals = new Map<string, number>()
  const cellTotals = new Map<string, number>()

  for (const inv of investments) {
    if (inv.reserveCategoryId && inv.walletCategoryId) {
      reserveTotals.set(
        inv.reserveCategoryId,
        (reserveTotals.get(inv.reserveCategoryId) ?? 0) + inv.amount
      )
      walletTotals.set(
        inv.walletCategoryId,
        (walletTotals.get(inv.walletCategoryId) ?? 0) + inv.amount
      )
      const key = `${inv.reserveCategoryId}:${inv.walletCategoryId}`
      cellTotals.set(key, (cellTotals.get(key) ?? 0) + inv.amount)
    }
  }

  const items: InvestmentSummaryItem[] = []
  for (const [key, total] of Array.from(cellTotals.entries())) {
    if (total <= 0) continue
    const [reserveId, walletId] = key.split(':')
    const reserve = categoriesById.get(reserveId)
    const wallet = categoriesById.get(walletId)
    if (reserve && wallet) {
      items.push({
        category: reserve,
        total,
        label: `${reserve.name} → ${wallet.name}`,
      })
    }
  }
  const legacyCategoryTotals = new Map<string, number>()
  for (const inv of investments) {
    if (inv.categoryId && !inv.reserveCategoryId && !inv.walletCategoryId) {
      legacyCategoryTotals.set(
        inv.categoryId,
        (legacyCategoryTotals.get(inv.categoryId) ?? 0) + inv.amount
      )
    }
  }
  for (const [catId, total] of Array.from(legacyCategoryTotals.entries())) {
    if (total <= 0) continue
    const cat = categoriesById.get(catId)
    if (cat) {
      items.push({ category: cat, total })
    }
  }
  const byReserve = Array.from(reserveTotals.entries())
    .filter(([, t]) => t > 0)
    .map(([id, total]) => ({
      category: categoriesById.get(id)!,
      total,
    }))
    .filter((x) => x.category)
    .sort((a, b) => b.total - a.total)

  const byWallet = Array.from(walletTotals.entries())
    .filter(([, t]) => t > 0)
    .map(([id, total]) => ({
      category: categoriesById.get(id)!,
      total,
    }))
    .filter((x) => x.category)
    .sort((a, b) => b.total - a.total)

  items.sort((a, b) => b.total - a.total)
  const total = investments.reduce((acc, i) => acc + i.amount, 0)

  return {
    total,
    items,
    byReserve,
    byWallet,
  }
}
