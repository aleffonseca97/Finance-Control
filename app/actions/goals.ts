'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createGoalSchema } from '@/lib/validations'
import { revalidateLocalePath, revalidateLocalePaths } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import { z } from 'zod'

export type GoalWithReserveProgress = {
  id: string
  name: string
  targetAmount: number
  deadline: Date | null
  createdAt: Date
  reserveCategoryId: string | null
  reserveCategoryName: string
  currentAmount: number
}

const GOAL_PATHS = ['/dashboard/metas', '/dashboard/investimentos']

function buildReserveFromGoalSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    name: z.string().trim().min(1, t('reserveNameRequired')),
  })
}

function buildUpdateGoalCurrentAmountSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    currentAmount: z.coerce.number().min(0, t('accumulatedNonNegative')),
  })
}

export async function createGoal(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const goalSchema = createGoalSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = goalSchema.safeParse({
    name: formData.get('name'),
    reserveCategoryId: formData.get('reserveCategoryId'),
    targetAmount: formData.get('targetAmount'),
    deadline: formData.get('deadline'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  let deadline: Date | null = null
  if (parsed.data.deadline) {
    deadline = new Date(parsed.data.deadline)
    if (Number.isNaN(deadline.getTime())) {
      return { error: tServer('invalidDeadline') }
    }

    const now = new Date()
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    if (deadline <= endOfToday) {
      return { error: tServer('futureDeadlineRequired') }
    }
  }

  if (parsed.data.reserveCategoryId) {
    const reserveCategory = await prisma.category.findFirst({
      where: {
        id: parsed.data.reserveCategoryId,
        type: 'investment',
        investmentSubtype: 'reserva',
        OR: [{ userId: null, isCustom: false }, { userId: session.user.id, isCustom: true }],
      },
      select: { id: true },
    })

    if (!reserveCategory) {
      return { error: tServer('invalidReserve') }
    }
  }

  await prisma.goal.create({
    data: {
      userId: session.user.id,
      reserveCategoryId: parsed.data.reserveCategoryId,
      name: parsed.data.name,
      targetAmount: parsed.data.targetAmount,
      deadline,
    },
  })

  await revalidateLocalePaths(GOAL_PATHS)
  return { success: true }
}

export async function deleteGoal(id: string) {
  const session = await auth()
  const t = await getErrorTranslations()
  if (!session?.user?.id) return { error: t('unauthorized') }

  await prisma.goal.deleteMany({
    where: { id, userId: session.user.id },
  })

  await revalidateLocalePaths(GOAL_PATHS)
  return { success: true }
}

export async function getGoals(): Promise<GoalWithReserveProgress[]> {
  const session = await auth()
  if (!session?.user?.id) return []

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    include: {
      reserveCategory: {
        select: { id: true, name: true },
      },
    },
    orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
  })

  const reserveIds = goals
    .map((goal) => goal.reserveCategoryId)
    .filter((id): id is string => Boolean(id))

  const totals = reserveIds.length
    ? await prisma.investment.groupBy({
        by: ['reserveCategoryId'],
        where: {
          userId: session.user.id,
          reserveCategoryId: { in: reserveIds },
        },
        _sum: { amount: true },
      })
    : []

  const totalsByReserve = new Map(
    totals
      .filter((item): item is typeof item & { reserveCategoryId: string } => Boolean(item.reserveCategoryId))
      .map((item) => [item.reserveCategoryId, item._sum.amount ?? 0]),
  )

  return goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    deadline: goal.deadline,
    createdAt: goal.createdAt,
    reserveCategoryId: goal.reserveCategoryId,
    reserveCategoryName: goal.reserveCategory?.name ?? 'Sem reserva vinculada',
    currentAmount: goal.reserveCategoryId ? totalsByReserve.get(goal.reserveCategoryId) ?? 0 : goal.currentAmount,
  }))
}

export async function createReserveFromGoal(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const reserveFromGoalSchema = buildReserveFromGoalSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = reserveFromGoalSchema.safeParse({
    name: formData.get('reserveName'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const existing = await prisma.category.findFirst({
    where: {
      userId: session.user.id,
      isCustom: true,
      type: 'investment',
      investmentSubtype: 'reserva',
      name: parsed.data.name,
    },
    select: { id: true },
  })

  if (existing) {
    return { error: tServer('reserveNameTaken') }
  }

  const createdReserve = await prisma.category.create({
    data: {
      userId: session.user.id,
      isCustom: true,
      name: parsed.data.name,
      group: 'Investimentos',
      icon: 'PiggyBank',
      color: '#6366f1',
      type: 'investment',
      isFixed: false,
      investmentSubtype: 'reserva',
    },
    select: { id: true, name: true },
  })

  await revalidateLocalePaths(GOAL_PATHS)
  return { success: true, reserve: createdReserve }
}

export async function updateGoalCurrentAmount(id: string, formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const updateGoalCurrentAmountSchema = buildUpdateGoalCurrentAmountSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

  const parsed = updateGoalCurrentAmountSchema.safeParse({
    currentAmount: formData.get('currentAmount'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const goal = await prisma.goal.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, reserveCategoryId: true },
  })

  if (!goal) return { error: tServer('goalNotFound') }
  if (goal.reserveCategoryId) {
    return { error: tServer('linkedGoalAutoUpdate') }
  }

  await prisma.goal.update({
    where: { id: goal.id },
    data: { currentAmount: parsed.data.currentAmount },
  })

  await revalidateLocalePath('/dashboard/metas')
  return { success: true }
}
