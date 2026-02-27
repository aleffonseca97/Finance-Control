'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

export async function ensureUserCategories(userId: string) {
  const count = await prisma.category.count({ where: { userId } })
  if (count > 0) return

  const categories: { userId: string; name: string; icon: string; type: string; isFixed: boolean; color: string }[] = []

  for (const cat of DEFAULT_CATEGORIES.income) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      type: 'income',
      isFixed: false,
      color: cat.color,
    })
  }

  for (const cat of DEFAULT_CATEGORIES.expense) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      type: 'expense',
      isFixed: cat.isFixed,
      color: cat.color,
    })
  }

  for (const cat of DEFAULT_CATEGORIES.investment) {
    categories.push({
      userId,
      name: cat.name,
      icon: cat.icon,
      type: 'investment',
      isFixed: false,
      color: cat.color,
    })
  }

  await prisma.category.createMany({ data: categories })
}

export async function getCategoriesByType(type: 'income' | 'expense' | 'investment') {
  const session = await auth()
  if (!session?.user?.id) return []

  await ensureUserCategories(session.user.id)

  return prisma.category.findMany({
    where: { userId: session.user.id, type },
    orderBy: { name: 'asc' },
  })
}
