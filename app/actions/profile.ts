'use server'

import { hash, compare } from 'bcryptjs'
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidateLocalePath } from '@/lib/i18n/revalidate'
import {
  getErrorTranslations,
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'

function createUpdateProfileSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    name: z.string().min(2, t('nameMin')),
    email: z.string().email(t('invalidEmail')),
    marketingOptIn: z.literal('on').optional(),
  })
}

function createUpdatePasswordSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    currentPassword: z.string().min(1, t('currentPasswordRequired')),
    newPassword: z.string().min(6, t('newPasswordMin')),
  })
}

export async function updateProfile(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const updateProfileSchema = createUpdateProfileSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

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
    return { error: tServer('emailInUse') }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      email: emailNormalized,
      marketingOptIn: marketingOptIn === 'on',
    },
  })

  await revalidateLocalePath('/dashboard/configuracoes')
  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const session = await auth()
  const t = await getErrorTranslations()
  const tServer = await getServerErrorTranslations()
  const tValidation = await getValidationTranslations()
  const updatePasswordSchema = createUpdatePasswordSchema(tValidation)

  if (!session?.user?.id) return { error: t('unauthorized') }

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

  if (!user) return { error: tServer('userNotFound') }

  const isValid = await compare(currentPassword, user.passwordHash)
  if (!isValid) return { error: tServer('wrongCurrentPassword') }

  const passwordHash = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  })

  await revalidateLocalePath('/dashboard/configuracoes')
  return { success: true }
}
