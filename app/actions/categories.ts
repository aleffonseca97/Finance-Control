'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_CATEGORIES } from '@/lib/categories'

const categorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  icon: z.string().min(1, 'Ícone é obrigatório'),
  color: z.string().min(1, 'Cor é obrigatória'),
})

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

export async function createCategory(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const type = formData.get('type') as 'income' | 'expense'
  const isFixed = formData.get('isFixed') === 'true'

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    icon: formData.get('icon'),
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const rawDefault = formData.get('defaultValue')
  const defaultNum = rawDefault && String(rawDefault).trim() !== ''
    ? parseFloat(String(rawDefault))
    : null
  const defaultValue = defaultNum != null && !isNaN(defaultNum) && defaultNum >= 0 ? defaultNum : null

  await ensureUserCategories(session.user.id)

  const data = {
    userId: session.user.id,
    name: parsed.data.name,
    icon: parsed.data.icon,
    color: parsed.data.color,
    type,
    isFixed: type === 'expense' ? isFixed : false,
    ...(type === 'expense' && isFixed && defaultValue != null && { defaultValue }),
  }

  await prisma.category.create({ data })

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard/entradas')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/investimentos')
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const type = formData.get('type') as 'income' | 'expense'
  const isFixed = formData.get('isFixed') === 'true'

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    icon: formData.get('icon'),
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const rawDefault = formData.get('defaultValue')
  const defaultNum = rawDefault && String(rawDefault).trim() !== ''
    ? parseFloat(String(rawDefault))
    : null
  const defaultValue = defaultNum != null && !isNaN(defaultNum) && defaultNum >= 0 ? defaultNum : null

  const existing = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: 'Categoria não encontrada' }

  const data = {
    name: parsed.data.name,
    icon: parsed.data.icon,
    color: parsed.data.color,
    isFixed: type === 'expense' ? isFixed : false,
    defaultValue: type === 'expense' && isFixed ? defaultValue : null,
  }

  await prisma.category.update({ where: { id }, data })

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard/entradas')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/investimentos')
  revalidatePath('/dashboard/analise')
  return { success: true }
}

export async function deleteCategory(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const existing = await prisma.category.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: 'Categoria não encontrada' }

  await prisma.category.delete({
    where: { id },
  })

  revalidatePath('/dashboard/configuracoes')
  revalidatePath('/dashboard/entradas')
  revalidatePath('/dashboard/saidas')
  revalidatePath('/dashboard/investimentos')
  revalidatePath('/dashboard/analise')
  return { success: true }
}
