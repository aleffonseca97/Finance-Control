'use server'

import { hash } from 'bcryptjs'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email/send'
import {
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import { z } from 'zod'
import {
  buildE164,
  digitsOnly,
  isValidCpf,
  isValidPhoneNational,
} from '@/lib/validation/br'

function createRegisterSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z
    .object({
      firstName: z.string().trim().min(2, t('firstNameMin')),
      lastName: z.string().trim().min(2, t('lastNameMin')),
      email: z.string().email(t('invalidEmail')),
      cpf: z.string().min(1, t('cpfRequired')),
      phoneDial: z.string().min(1, t('countryCodeRequired')),
      phoneNational: z.string().min(1, t('phoneRequired')),
      password: z.string().min(6, t('passwordMin')),
      passwordConfirm: z.string().min(1, t('passwordConfirmRequired')),
      marketingOptIn: z.boolean().optional(),
    })
    .refine((d) => d.password === d.passwordConfirm, {
      message: t('passwordsMismatch'),
      path: ['passwordConfirm'],
    })
    .superRefine((data, ctx) => {
      const cpfDigits = digitsOnly(data.cpf)
      if (cpfDigits.length !== 11) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('cpfDigits'),
          path: ['cpf'],
        })
        return
      }
      if (!isValidCpf(cpfDigits)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('cpfInvalid'),
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
              ? t('phoneInvalidBr')
              : t('phoneInvalidIntl'),
          path: ['phoneNational'],
        })
      }
    })
}

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
  const tValidation = await getValidationTranslations()
  const tServer = await getServerErrorTranslations()
  const registerSchema = createRegisterSchema(tValidation)

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
    return { errors: { email: tServer('emailTaken') } }
  }

  const cpfTaken = await prisma.user.findFirst({
    where: { cpf: cpfNormalized },
  })
  if (cpfTaken) {
    return { errors: { cpf: tServer('cpfTaken') } }
  }

  const passwordHash = await hash(password, 12)
  const emailNormalized = email.trim().toLowerCase()
  const locale = await getLocale()

  await prisma.user.create({
    data: {
      name,
      email: emailNormalized,
      passwordHash,
      cpf: cpfNormalized,
      phone: phoneE164,
      marketingOptIn: marketingOptIn ?? false,
      locale,
    },
  })

  void sendWelcomeEmail({
    to: emailNormalized,
    name: name ?? null,
    locale,
  }).catch((err) => {
    console.error('[email] Falha ao enviar boas-vindas:', err)
  })

  return { success: true }
}
