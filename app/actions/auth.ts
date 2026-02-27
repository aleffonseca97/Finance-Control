'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { name, email, password } = parsed.data

  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    return { error: 'Este email já está cadastrado' }
  }

  const passwordHash = await hash(password, 12)

  await prisma.user.create({
    data: { name, email, passwordHash },
  })

  return { success: true }
}
