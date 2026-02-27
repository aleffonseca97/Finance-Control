'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { investmentSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'

export async function createInvestment(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = investmentSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amount: formData.get('amount'),
    date: formData.get('date'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const category = await prisma.category.findFirst({
    where: {
      id: parsed.data.categoryId,
      userId: session.user.id,
      type: 'investment',
    },
  })

  if (!category) return { error: 'Categoria inválida' }

  await prisma.investment.create({
    data: {
      userId: session.user.id,
      categoryId: parsed.data.categoryId,
      amount: parsed.data.amount,
      date: new Date(parsed.data.date),
      notes: parsed.data.notes || null,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/investimentos')
  revalidatePath('/dashboard/analise')
  return { success: true }
}

export async function deleteInvestment(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  await prisma.investment.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/investimentos')
  revalidatePath('/dashboard/analise')
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
      include: { category: true },
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
