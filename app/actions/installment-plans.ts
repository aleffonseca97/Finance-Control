'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  countRemainingDueInYear,
  monthlyTotalsRemainingInYear,
  remainingAmountInYear,
} from '@/lib/installment-schedule'
import { installmentPlanUpsertSchema } from '@/lib/validations'

function revalidateInstallmentPaths() {
  revalidatePath('/dashboard/parcelamentos')
  revalidatePath('/dashboard/analise')
  revalidatePath('/dashboard')
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
  remainingInstallments: number
  remainingDueInYear: number
  remainingAmountInYear: number
}

export type InstallmentPlansPageData = {
  year: number
  plans: InstallmentPlanRow[]
  monthlyTotals: number[]
  totalRemainingInYear: number
  peakMonthAmount: number
}

export async function getInstallmentPlansPageData(calendarYear: number): Promise<InstallmentPlansPageData | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const raw = await prisma.installmentPlan.findMany({
    where: { userId: session.user.id },
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
      remainingInstallments,
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
  )

  const totalRemainingInYear = monthlyTotals.reduce((a, b) => a + b, 0)
  const peakMonthAmount = monthlyTotals.length ? Math.max(...monthlyTotals, 0) : 0

  return {
    year: calendarYear,
    plans,
    monthlyTotals,
    totalRemainingInYear,
    peakMonthAmount,
  }
}

function firstZodMessage(err: { issues: { message: string }[] }) {
  return err.issues[0]?.message ?? 'Dados inválidos'
}

export async function createInstallmentPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = installmentPlanUpsertSchema.safeParse({
    kind: formData.get('kind'),
    name: formData.get('name'),
    monthlyAmount: formData.get('monthlyAmount'),
    totalInstallments: formData.get('totalInstallments'),
    paidInstallments: formData.get('paidInstallments'),
    firstInstallmentDate: formData.get('firstInstallmentDate'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) return { error: firstZodMessage(parsed.error) }

  const first = parseDateOnlyToUtc(parsed.data.firstInstallmentDate)
  if (!first || Number.isNaN(first.getTime())) return { error: 'Data da primeira parcela inválida' }

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
    },
  })

  revalidateInstallmentPaths()
  return { success: true as const }
}

export async function updateInstallmentPlan(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = installmentPlanUpsertSchema.safeParse({
    id: formData.get('id'),
    kind: formData.get('kind'),
    name: formData.get('name'),
    monthlyAmount: formData.get('monthlyAmount'),
    totalInstallments: formData.get('totalInstallments'),
    paidInstallments: formData.get('paidInstallments'),
    firstInstallmentDate: formData.get('firstInstallmentDate'),
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
  if (!first || Number.isNaN(first.getTime())) return { error: 'Data da primeira parcela inválida' }

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
    },
  })

  revalidateInstallmentPaths()
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
  return { success: true as const }
}
