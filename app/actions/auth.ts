'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email/send'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  marketingOptIn: z.boolean().optional(),
})

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password, marketingOptIn } = parsed.data

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  })

  if (existing) {
    return { error: 'Este email já está cadastrado' }
  }

  const passwordHash = await hash(password, 12)

  const emailNormalized = email.trim().toLowerCase()

  await prisma.user.create({
    data: {
      name,
      email: emailNormalized,
      passwordHash,
      marketingOptIn: marketingOptIn ?? false,
    },
  })

  void sendWelcomeEmail({ to: emailNormalized, name: name ?? null }).catch((err) => {
    console.error('[email] Falha ao enviar boas-vindas:', err)
  })

  return { success: true }
}
