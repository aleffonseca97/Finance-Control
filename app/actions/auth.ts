'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email/send'
import { z } from 'zod'
import {
  buildE164,
  digitsOnly,
  isValidCpf,
  isValidPhoneNational,
} from '@/lib/validation/br'

const registerSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    lastName: z
      .string()
      .trim()
      .min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    cpf: z.string().min(1, 'CPF é obrigatório'),
    phoneDial: z.string().min(1, 'Código do país é obrigatório'),
    phoneNational: z.string().min(1, 'Telefone é obrigatório'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    passwordConfirm: z.string().min(1, 'Confirmação de senha é obrigatória'),
    marketingOptIn: z.boolean().optional(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    message: 'As senhas não coincidem',
    path: ['passwordConfirm'],
  })
  .superRefine((data, ctx) => {
    const cpfDigits = digitsOnly(data.cpf)
    if (cpfDigits.length !== 11) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF deve ter 11 dígitos',
        path: ['cpf'],
      })
      return
    }
    if (!isValidCpf(cpfDigits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CPF inválido',
        path: ['cpf'],
      })
    }
  })
  .superRefine((data, ctx) => {
    if (!isValidPhoneNational(data.phoneDial, data.phoneNational)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          data.phoneDial === '55'
            ? 'Telefone inválido: use DDD + número (10 ou 11 dígitos)'
            : 'Telefone inválido para o código de país selecionado',
        path: ['phoneNational'],
      })
    }
  })

export type RegisterFieldErrors = Partial<
  Record<
    | 'firstName'
    | 'lastName'
    | 'email'
    | 'cpf'
    | 'phoneDial'
    | 'phoneNational'
    | 'password'
    | 'passwordConfirm',
    string
  >
>

export type RegisterResult = { success: true } | { errors: RegisterFieldErrors }

function zodToFieldErrors(fieldErrors: Record<string, string[] | undefined>) {
  const errors: RegisterFieldErrors = {}
  const keys: (keyof RegisterFieldErrors)[] = [
    'firstName',
    'lastName',
    'email',
    'cpf',
    'phoneDial',
    'phoneNational',
    'password',
    'passwordConfirm',
  ]
  for (const key of keys) {
    const msgs = fieldErrors[key]
    if (msgs?.[0]) errors[key] = msgs[0]
  }
  return errors
}

export async function register(formData: FormData): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    cpf: formData.get('cpf'),
    phoneDial: formData.get('phoneDial'),
    phoneNational: formData.get('phoneNational'),
    password: formData.get('password'),
    passwordConfirm: formData.get('passwordConfirm'),
    marketingOptIn: formData.get('marketingOptIn') === 'on',
  })

  if (!parsed.success) {
    const { fieldErrors } = parsed.error.flatten()
    return { errors: zodToFieldErrors(fieldErrors) }
  }

  const {
    firstName,
    lastName,
    email,
    cpf,
    phoneDial,
    phoneNational,
    password,
    marketingOptIn,
  } = parsed.data

  const name = `${firstName} ${lastName}`.trim()
  const cpfNormalized = digitsOnly(cpf)
  const phoneE164 = buildE164(phoneDial, phoneNational)

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: 'insensitive' } },
  })

  if (existing) {
    return { errors: { email: 'Este email já está cadastrado' } }
  }

  const cpfTaken = await prisma.user.findFirst({
    where: { cpf: cpfNormalized },
  })
  if (cpfTaken) {
    return { errors: { cpf: 'Este CPF já está cadastrado' } }
  }

  const passwordHash = await hash(password, 12)

  const emailNormalized = email.trim().toLowerCase()

  await prisma.user.create({
    data: {
      name,
      email: emailNormalized,
      passwordHash,
      cpf: cpfNormalized,
      phone: phoneE164,
      marketingOptIn: marketingOptIn ?? false,
    },
  })

  void sendWelcomeEmail({ to: emailNormalized, name: name ?? null }).catch((err) => {
    console.error('[email] Falha ao enviar boas-vindas:', err)
  })

  return { success: true }
}
