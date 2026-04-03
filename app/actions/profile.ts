'use server'

import { hash, compare } from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  marketingOptIn: z.literal('on').optional(),
})

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
})

export async function updateProfile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const marketingRaw = formData.get('marketingOptIn')
  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    marketingOptIn: marketingRaw === 'on' ? ('on' as const) : undefined,
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, marketingOptIn } = parsed.data

  const emailNormalized = email.trim().toLowerCase()

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: emailNormalized, mode: 'insensitive' } },
  })

  if (existingUser && existingUser.id !== session.user.id) {
    return { error: 'Este email já está em uso' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email: emailNormalized,
      marketingOptIn: marketingOptIn === 'on',
    },
  })

  revalidatePath('/dashboard/configuracoes')
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  const parsed = updatePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) return { error: 'Usuário não encontrado' }

  const isValid = await compare(currentPassword, user.passwordHash)
  if (!isValid) return { error: 'Senha atual incorreta' }

  const passwordHash = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  })

  revalidatePath('/dashboard/configuracoes')
  return { success: true }
}
