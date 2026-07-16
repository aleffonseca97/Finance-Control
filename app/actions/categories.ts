'use server'

import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { DEFAULT_CATEGORIES } from '@/lib/categories'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'

function buildCategorySchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    name: z.string().min(1, t('nameRequired')),
    group: z.string().optional(),
    icon: z.string().min(1, t('iconRequired')),
    color: z.string().min(1, t('colorRequired')),
    investmentSubtype: z.enum(['reserva', 'carteira']).optional(),
  })
}

const CATEGORY_PATHS = [
  '/dashboard/configuracoes',
  '/dashboard/configuracoes/categorias',
  '/dashboard/configuracoes/investimentos',
  '/dashboard/entradas',
  '/dashboard/saidas',
  '/dashboard/investimentos',
]

type GlobalCategorySeed = {
  userId: null
  name: string
  group?: string
  icon: string
  type: string
  isCustom: boolean
  isFixed: boolean
  color: string
  investmentSubtype?: string
}

function buildGlobalCategorySeeds(): GlobalCategorySeed[] {
  const categories: GlobalCategorySeed[] = []

  for (const cat of DEFAULT_CATEGORIES.income) {
    categories.push({
      userId: null,
      name: cat.name,
      group: cat.group,
      icon: cat.icon,
      type: 'income',
      isCustom: false,
      isFixed: false,
      color: cat.color,
    })
  }

  for (const cat of DEFAULT_CATEGORIES.expense) {
    categories.push({
      userId: null,
      name: cat.name,
      group: cat.group,
      icon: cat.icon,
      type: 'expense',
      isCustom: false,
      isFixed: cat.isFixed,
      color: cat.color,
    })
  }

  for (const cat of DEFAULT_CATEGORIES.investment_reserve) {
    categories.push({
      userId: null,
      name: cat.name,
      group: cat.group,
      icon: cat.icon,
      type: 'investment',
      isCustom: false,
      isFixed: false,
      color: cat.color,
      investmentSubtype: 'reserva',
    })
  }
  for (const cat of DEFAULT_CATEGORIES.investment_wallet) {
    categories.push({
      userId: null,
      name: cat.name,
      group: cat.group,
      icon: cat.icon,
      type: 'investment',
      isCustom: false,
      isFixed: false,
      color: cat.color,
      investmentSubtype: 'carteira',
    })
  }

  return categories
}

function globalCategorySeedKey(row: {
  type: string
  name: string
  investmentSubtype?: string | null
}): string {
  if (row.type === 'investment') {
    return `investment:${row.investmentSubtype ?? ''}:${row.name}`
  }
  return `${row.type}:${row.name}`
}

export async function ensureGlobalCategories() {
  const seeds = buildGlobalCategorySeeds()
  const existing = await prisma.category.findMany({
    where: { userId: null, isCustom: false },
    select: { name: true, type: true, investmentSubtype: true },
  })

  if (existing.length === 0) {
    if (seeds.length > 0) {
      await prisma.category.createMany({ data: seeds })
    }
    return
  }

  const existingKeys = new Set(existing.map((c) => globalCategorySeedKey(c)))

  for (const row of seeds) {
    const key = globalCategorySeedKey(row)
    if (!existingKeys.has(key)) {
      await prisma.category.create({ data: row })
      existingKeys.add(key)
    }
  }
}

export async function getCategoriesByType(type: 'income' | 'expense' | 'investment') {
  const session = await auth()
  if (!session?.user?.id) return []

  await ensureGlobalCategories()

  return prisma.category.findMany({
    where: {
      type,
      OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
    },
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  })
}

export async function getReserveCategories() {
  const session = await auth()
  if (!session?.user?.id) return []
  await ensureGlobalCategories()
  return prisma.category.findMany({
    where: {
      type: 'investment',
      investmentSubtype: 'reserva',
      OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
    },
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  })
}

export async function getWalletCategories() {
  const session = await auth()
  if (!session?.user?.id) return []
  await ensureGlobalCategories()
  return prisma.category.findMany({
    where: {
      type: 'investment',
      investmentSubtype: 'carteira',
      OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
    },
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  })
}

export async function getUserCategoriesByType(type: 'income' | 'expense' | 'investment') {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.category.findMany({
    where: { userId: session.user.id, type, isCustom: true },
    orderBy: [{ group: 'asc' }, { name: 'asc' }],
  })
}

export async function createCategory(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const categorySchema = buildCategorySchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const type = formData.get('type') as 'income' | 'expense' | 'investment'
  const isFixed = formData.get('isFixed') === 'true'

  if (!['income', 'expense', 'investment'].includes(type)) {
    return { error: tServer('invalidCategoryType') }
  }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    group: formData.get('group') || undefined,
    icon: formData.get('icon'),
    color: formData.get('color') || '#6366f1',
    investmentSubtype: formData.get('investmentSubtype') || undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const rawDefault = formData.get('defaultValue')
  const defaultNum = rawDefault && String(rawDefault).trim() !== ''
    ? parseFloat(String(rawDefault))
    : null
  const defaultValue = defaultNum != null && !isNaN(defaultNum) && defaultNum >= 0 ? defaultNum : null

  if (type === 'investment' && !parsed.data.investmentSubtype) {
    return { error: tServer('selectReserveOrWallet') }
  }

  const data = {
    userId: session.user.id,
    isCustom: true,
    name: parsed.data.name,
    group: parsed.data.group?.trim() || (type === 'investment' ? 'Investimentos' : 'Personalizada'),
    icon: parsed.data.icon,
    color: parsed.data.color,
    type,
    isFixed: type === 'expense' ? isFixed : false,
    ...(type === 'expense' && isFixed && defaultValue != null && { defaultValue }),
    ...(type === 'investment' && parsed.data.investmentSubtype && {
      investmentSubtype: parsed.data.investmentSubtype,
    }),
  }

  await prisma.category.create({ data })

  await revalidateLocalePaths(CATEGORY_PATHS)
  return { success: true }
}

export async function updateCategory(id: string, formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const categorySchema = buildCategorySchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const type = formData.get('type') as 'income' | 'expense' | 'investment'
  const isFixed = formData.get('isFixed') === 'true'

  if (!['income', 'expense', 'investment'].includes(type)) {
    return { error: tServer('invalidCategoryType') }
  }

  const parsed = categorySchema.safeParse({
    name: formData.get('name'),
    group: formData.get('group') || undefined,
    icon: formData.get('icon'),
    color: formData.get('color') || '#6366f1',
    investmentSubtype: formData.get('investmentSubtype') || undefined,
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
    where: { id, userId: session.user.id, isCustom: true },
  })

  if (!existing) return { error: tServer('categoryNotFound') }

  if (type === 'investment' && !parsed.data.investmentSubtype) {
    return { error: tServer('selectReserveOrWallet') }
  }

  const data = {
    name: parsed.data.name,
    group: parsed.data.group?.trim() || (type === 'investment' ? 'Investimentos' : 'Personalizada'),
    icon: parsed.data.icon,
    color: parsed.data.color,
    isFixed: type === 'expense' ? isFixed : false,
    defaultValue: type === 'expense' && isFixed ? defaultValue : null,
    ...(type === 'investment' && parsed.data.investmentSubtype && {
      investmentSubtype: parsed.data.investmentSubtype,
    }),
  }

  await prisma.category.update({ where: { id }, data })

  await revalidateLocalePaths([...CATEGORY_PATHS, '/dashboard/analise'])
  return { success: true }
}

export async function deleteCategory(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()

  if (!session?.user?.id) return { error: t('unauthorized') }

  const existing = await prisma.category.findFirst({
    where: { id, userId: session.user.id, isCustom: true },
  })

  if (!existing) return { error: tServer('categoryNotFound') }

  await prisma.category.delete({
    where: { id },
  })

  await revalidateLocalePaths([...CATEGORY_PATHS, '/dashboard/analise'])
  return { success: true }
}
