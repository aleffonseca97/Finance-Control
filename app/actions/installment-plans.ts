'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  countRemainingDueInYear,
  monthlyTotalsRemainingInYear,
  remainingAmountInYear,
} from '@/lib/installment-schedule'
import { roundMoney } from '@/lib/credit-card-billing'
import { installmentPlanUpsertSchema } from '@/lib/validations'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'

function revalidateInstallmentPaths() {
  revalidatePath('/dashboard/parcelamentos')
  revalidatePath('/dashboard/analise')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/cartao-credito')
}

function parseDateOnlyToUtc(iso: string): Date | null {
  if (typeof iso !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return null
  return new Date(`${iso.trim()}T12:00:00.000Z`)
}

export type InstallmentPlanRow = {
  id: string
  kind: string
  name: string
  monthlyAmount: number
  totalInstallments: number
  paidInstallments: number
  firstInstallmentDate: string
  notes: string | null
  creditCardId: string | null
  creditCardName: string | null
  creditCardLastFour: string | null
  creditCardColor: string | null
  remainingInstallments: number
  remainingAmount: number
  remainingDueInYear: number
  remainingAmountInYear: number
}

export type InstallmentPlansByCard = {
  creditCardId: string
  creditCardName: string
  creditCardLastFour: string | null
  creditCardColor: string | null
  activePlanCount: number
  activeMonthlyCommitment: number
  remainingAmountInYear: number
}

export type InstallmentPlansPageData = {
  year: number
  plans: InstallmentPlanRow[]
  monthlyTotals: number[]
  totalRemainingInYear: number
  peakMonthAmount: number
  peakMonthIndex: number
  activeMonthlyCommitment: number
  byCard: InstallmentPlansByCard[]
}

export async function getInstallmentPlansPageData(
  calendarYear: number,
): Promise<InstallmentPlansPageData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const raw = await prisma.installmentPlan.findMany({
    where: {
      userId: session.user.id,
      kind: 'CREDIT_CARD',
      creditCardId: { not: null },
    },
    include: {
      creditCard: {
        select: { id: true, name: true, lastFour: true, color: true },
      },
    },
    orderBy: [{ createdAt: 'desc' }],
  })

  const plans: InstallmentPlanRow[] = raw.map((p) => {
    const remainingInstallments = Math.max(0, p.totalInstallments - p.paidInstallments)
    const remainingDueInYear = countRemainingDueInYear(
      p.firstInstallmentDate,
      p.totalInstallments,
      p.paidInstallments,
      calendarYear,
    )
    const amountInYear = remainingAmountInYear(
      p.monthlyAmount,
      p.firstInstallmentDate,
      p.totalInstallments,
      p.paidInstallments,
      calendarYear,
    )
    return {
      id: p.id,
      kind: p.kind,
      name: p.name,
      monthlyAmount: p.monthlyAmount,
      totalInstallments: p.totalInstallments,
      paidInstallments: p.paidInstallments,
      firstInstallmentDate: p.firstInstallmentDate.toISOString().slice(0, 10),
      notes: p.notes,
      creditCardId: p.creditCardId,
      creditCardName: p.creditCard?.name ?? null,
      creditCardLastFour: p.creditCard?.lastFour ?? null,
      creditCardColor: p.creditCard?.color ?? null,
      remainingInstallments,
      remainingAmount: roundMoney(remainingInstallments * p.monthlyAmount),
      remainingDueInYear,
      remainingAmountInYear: amountInYear,
    }
  })

  const monthlyTotals = monthlyTotalsRemainingInYear(
    raw.map((p) => ({
      monthlyAmount: p.monthlyAmount,
      firstInstallmentDate: p.firstInstallmentDate,
      totalInstallments: p.totalInstallments,
      paidInstallments: p.paidInstallments,
    })),
    calendarYear,
  ).map(roundMoney)

  const totalRemainingInYear = roundMoney(monthlyTotals.reduce((a, b) => a + b, 0))
  const peakMonthAmount = monthlyTotals.length ? Math.max(...monthlyTotals, 0) : 0
  const peakMonthIndex =
    peakMonthAmount > 0 ? monthlyTotals.indexOf(peakMonthAmount) : -1

  const activeMonthlyCommitment = roundMoney(
    plans
      .filter((p) => p.remainingInstallments > 0)
      .reduce((s, p) => s + p.monthlyAmount, 0),
  )

  const byCardMap = new Map<string, InstallmentPlansByCard>()
  for (const p of plans) {
    if (!p.creditCardId) continue
    const existing = byCardMap.get(p.creditCardId)
    const isActive = p.remainingInstallments > 0
    if (!existing) {
      byCardMap.set(p.creditCardId, {
        creditCardId: p.creditCardId,
        creditCardName: p.creditCardName ?? '—',
        creditCardLastFour: p.creditCardLastFour,
        creditCardColor: p.creditCardColor,
        activePlanCount: isActive ? 1 : 0,
        activeMonthlyCommitment: isActive ? p.monthlyAmount : 0,
        remainingAmountInYear: p.remainingAmountInYear,
      })
    } else {
      if (isActive) {
        existing.activePlanCount += 1
        existing.activeMonthlyCommitment = roundMoney(
          existing.activeMonthlyCommitment + p.monthlyAmount,
        )
      }
      existing.remainingAmountInYear = roundMoney(
        existing.remainingAmountInYear + p.remainingAmountInYear,
      )
    }
  }

  const byCard = Array.from(byCardMap.values()).sort(
    (a, b) => b.remainingAmountInYear - a.remainingAmountInYear,
  )

  return {
    year: calendarYear,
    plans,
    monthlyTotals,
    totalRemainingInYear,
    peakMonthAmount,
    peakMonthIndex,
    activeMonthlyCommitment,
    byCard,
  }
}

function firstZodMessage(err: { issues: { message: string }[] }) {
  return err.issues[0]?.message ?? 'Dados inválidos'
}

async function resolveCreditCardId(
  userId: string,
  kind: string,
  creditCardId: string | undefined,
): Promise<{ creditCardId: string | null; error?: string }> {
  if (kind !== 'CREDIT_CARD') {
    return { creditCardId: null }
  }
  if (!creditCardId) {
    return { creditCardId: null, error: 'Selecione o cartão de crédito' }
  }
  const card = await prisma.creditCard.findFirst({
    where: { id: creditCardId, userId },
    select: { id: true },
  })
  if (!card) return { creditCardId: null, error: 'Cartão não encontrado' }
  return { creditCardId: card.id }
}

export async function createInstallmentPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = installmentPlanUpsertSchema.safeParse({
    kind: formData.get('kind') || 'CREDIT_CARD',
    name: formData.get('name'),
    monthlyAmount: formData.get('monthlyAmount'),
    totalInstallments: formData.get('totalInstallments'),
    paidInstallments: formData.get('paidInstallments') || '0',
    firstInstallmentDate: formData.get('firstInstallmentDate'),
    creditCardId: formData.get('creditCardId'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) return { error: firstZodMessage(parsed.error) }

  const first = parseDateOnlyToUtc(parsed.data.firstInstallmentDate)
  if (!first || Number.isNaN(first.getTime())) {
    return { error: 'Data da primeira parcela inválida' }
  }

  const cardResolved = await resolveCreditCardId(
    session.user.id,
    parsed.data.kind,
    parsed.data.creditCardId,
  )
  if (cardResolved.error) return { error: cardResolved.error }

  await prisma.installmentPlan.create({
    data: {
      userId: session.user.id,
      kind: parsed.data.kind,
      name: parsed.data.name,
      monthlyAmount: parsed.data.monthlyAmount,
      totalInstallments: parsed.data.totalInstallments,
      paidInstallments: parsed.data.paidInstallments,
      firstInstallmentDate: first,
      notes: parsed.data.notes ?? null,
      creditCardId: cardResolved.creditCardId,
    },
  })

  revalidateInstallmentPaths()
  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard/parcelamentos'])
  return { success: true as const }
}

export async function updateInstallmentPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = installmentPlanUpsertSchema.safeParse({
    id: formData.get('id'),
    kind: formData.get('kind') || 'CREDIT_CARD',
    name: formData.get('name'),
    monthlyAmount: formData.get('monthlyAmount'),
    totalInstallments: formData.get('totalInstallments'),
    paidInstallments: formData.get('paidInstallments') || '0',
    firstInstallmentDate: formData.get('firstInstallmentDate'),
    creditCardId: formData.get('creditCardId'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) return { error: firstZodMessage(parsed.error) }
  if (!parsed.data.id) return { error: 'Identificador ausente' }

  const owned = await prisma.installmentPlan.findFirst({
    where: { id: parsed.data.id, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) return { error: 'Registro não encontrado' }

  const first = parseDateOnlyToUtc(parsed.data.firstInstallmentDate)
  if (!first || Number.isNaN(first.getTime())) {
    return { error: 'Data da primeira parcela inválida' }
  }

  const cardResolved = await resolveCreditCardId(
    session.user.id,
    parsed.data.kind,
    parsed.data.creditCardId,
  )
  if (cardResolved.error) return { error: cardResolved.error }

  await prisma.installmentPlan.update({
    where: { id: parsed.data.id },
    data: {
      kind: parsed.data.kind,
      name: parsed.data.name,
      monthlyAmount: parsed.data.monthlyAmount,
      totalInstallments: parsed.data.totalInstallments,
      paidInstallments: parsed.data.paidInstallments,
      firstInstallmentDate: first,
      notes: parsed.data.notes ?? null,
      creditCardId: cardResolved.creditCardId,
    },
  })

  revalidateInstallmentPaths()
  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard/parcelamentos'])
  return { success: true as const }
}

export async function deleteInstallmentPlan(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const owned = await prisma.installmentPlan.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  })
  if (!owned) return { error: 'Registro não encontrado' }

  await prisma.installmentPlan.delete({ where: { id } })
  revalidateInstallmentPaths()
  await revalidateLocalePaths(['/dashboard/cartao-credito', '/dashboard/parcelamentos'])
  return { success: true as const }
}
