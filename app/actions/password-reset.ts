'use server'

import { hash } from 'bcryptjs'
import { getLocale } from 'next-intl/server'
import { prisma } from '@/lib/db'
import { getAppBaseUrl } from '@/lib/email/app-url'
import { sendPasswordResetEmail } from '@/lib/email/send'
import { createPasswordResetToken, hashResetToken } from '@/lib/email/reset-token'
import { isAppLocale } from '@/i18n/routing'
import {
  getServerErrorTranslations,
  getValidationTranslations,
} from '@/lib/i18n/validation'
import { z } from 'zod'

function createRequestSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    email: z.string().email(t('invalidEmail')),
  })
}

function createResetSchema(
  t: Awaited<ReturnType<typeof getValidationTranslations>>,
) {
  return z.object({
    token: z.string().min(1, t('tokenInvalid')),
    newPassword: z.string().min(6, t('newPasswordMin')),
  })
}

export async function requestPasswordReset(formData: FormData) {
  const tValidation = await getValidationTranslations()
  const tServer = await getServerErrorTranslations()
  const requestSchema = createRequestSchema(tValidation)
  const requestLocale = await getLocale()

  const parsed = requestSchema.safeParse({
    email: formData.get('email'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { email } = parsed.data
  const trimmed = email.trim()

  const user = await prisma.user.findFirst({
    where: { email: { equals: trimmed, mode: 'insensitive' } },
  })

  if (user) {
    const { token, tokenHash } = createPasswordResetToken()
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: tokenHash, passwordResetExpires },
    })

    try {
      const base = getAppBaseUrl()
      const userLocale =
        user.locale && isAppLocale(user.locale) ? user.locale : requestLocale
      const resetUrl = `${base}/${userLocale}/redefinir-senha?token=${encodeURIComponent(token)}`
      const sent = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
        locale: userLocale,
      })
      if (sent.ok === false && !sent.skipped) {
        console.error('[email] Falha ao enviar reset de senha:', sent.error)
      }
    } catch (err) {
      console.error('[email] Erro ao montar/enviar reset de senha:', err)
    }
  }

  return { success: true, message: tServer('passwordResetGeneric') }
}

export async function resetPasswordWithToken(formData: FormData) {
  const tValidation = await getValidationTranslations()
  const tServer = await getServerErrorTranslations()
  const resetSchema = createResetSchema(tValidation)

  const parsed = resetSchema.safeParse({
    token: formData.get('token'),
    newPassword: formData.get('newPassword'),
  })

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message }
  }

  const { token, newPassword } = parsed.data
  const tokenHash = hashResetToken(token)

  const user = await prisma.user.findFirst({
    where: {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { gt: new Date() },
    },
  })

  if (!user) {
    return { error: tServer('resetLinkInvalid') }
  }

  const passwordHash = await hash(newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    },
  })

  return { success: true }
}
