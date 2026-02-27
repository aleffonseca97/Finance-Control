'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.coerce.number().min(0, 'Limite deve ser positivo'),
  closingDay: z.coerce.number().min(1, 'Dia inválido').max(31, 'Dia inválido'),
  dueDay: z.coerce.number().min(1, 'Dia inválido').max(31, 'Dia inválido'),
  lastFour: z.string().max(4).optional().nullable(),
  color: z.string().optional(),
})

export async function getCreditCards() {
  const session = await auth()
  if (!session?.user?.id) return []

  return prisma.creditCard.findMany({
    where: { userId: session.user.id },
    orderBy: { name: 'asc' },
  })
}

export async function createCreditCard(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const lastFour = formData.get('lastFour')
  const parsed = creditCardSchema.safeParse({
    name: formData.get('name'),
    limit: formData.get('limit'),
    closingDay: formData.get('closingDay'),
    dueDay: formData.get('dueDay'),
    lastFour: lastFour && String(lastFour).trim() ? String(lastFour).replace(/\D/g, '').slice(-4) : null,
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  await prisma.creditCard.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      limit: parsed.data.limit,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}

export async function updateCreditCard(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const lastFour = formData.get('lastFour')
  const parsed = creditCardSchema.safeParse({
    name: formData.get('name'),
    limit: formData.get('limit'),
    closingDay: formData.get('closingDay'),
    dueDay: formData.get('dueDay'),
    lastFour: lastFour && String(lastFour).trim() ? String(lastFour).replace(/\D/g, '').slice(-4) : null,
    color: formData.get('color') || '#6366f1',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const existing = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: 'Cartão não encontrado' }

  await prisma.creditCard.update({
    where: { id },
    data: {
      name: parsed.data.name,
      limit: parsed.data.limit,
      closingDay: parsed.data.closingDay,
      dueDay: parsed.data.dueDay,
      lastFour: parsed.data.lastFour,
      color: parsed.data.color,
    },
  })

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}

export async function deleteCreditCard(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const existing = await prisma.creditCard.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!existing) return { error: 'Cartão não encontrado' }

  await prisma.creditCard.delete({ where: { id } })

  revalidatePath('/dashboard/cartao-credito')
  return { success: true }
}
