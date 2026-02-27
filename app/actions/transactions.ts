'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { transactionSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createTransaction(
  type: 'income' | 'expense',
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = transactionSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    date: formData.get('date'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: session.user.id, type },
  })

  if (!category) return { error: 'Categoria inválida' }

  await prisma.transaction.create({
    data: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
      description: parsed.data.description || null,
      date: new Date(parsed.data.date),
      type,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/entradas')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/analise')
  return { success: true }
}

export async function createIncome(formData: FormData) {
  return createTransaction('income', formData)
}

export async function createExpense(formData: FormData) {
  return createTransaction('expense', formData)
}

export async function deleteTransaction(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  await prisma.transaction.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/entradas')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/analise')
  return { success: true }
}

export async function getTransactions(
  type: 'income' | 'expense',
  month?: number,
  year?: number
) {
  const session = await auth()
  if (!session?.user?.id) return { transactions: [], total: 0 }

  const now = new Date()
  const m = month ?? now.getMonth()
  const y = year ?? now.getFullYear()
  const start = new Date(y, m, 1)
  const end = new Date(y, m + 1, 0)

  const [transactions, agg] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id, type, date: { gte: start, lte: end } },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.aggregate({
      where: { userId: session.user.id, type, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ])

  return {
    transactions,
    total: agg._sum.amount ?? 0,
  }
}
