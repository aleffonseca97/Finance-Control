'use server'

import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { getAppBaseUrl } from '@/lib/email/app-url'
import { sendPasswordResetEmail } from '@/lib/email/send'
import { createPasswordResetToken, hashResetToken } from '@/lib/email/reset-token'
import { z } from 'zod'

const GENERIC_REQUEST_MESSAGE =
  'Se existir uma conta com este e-mail, enviamos instruções para redefinir a senha.'

const requestSchema = z.object({
  email: z.string().email('Email inválido'),
})

const resetSchema = z.object({
  token: z.string().min(1, 'Token inválido'),
  newPassword: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
})

export async function requestPasswordReset(formData: FormData) {
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
      const resetUrl = `${base}/redefinir-senha?token=${encodeURIComponent(token)}`
      const sent = await sendPasswordResetEmail({
        to: user.email,
        resetUrl,
      })
      if (sent.ok === false && !sent.skipped) {
        console.error('[email] Falha ao enviar reset de senha:', sent.error)
      }
    } catch (err) {
      console.error('[email] Erro ao montar/enviar reset de senha:', err)
    }
  }

  return { success: true, message: GENERIC_REQUEST_MESSAGE }
}

export async function resetPasswordWithToken(formData: FormData) {
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
    return { error: 'Link inválido ou expirado. Solicite um novo e-mail de redefinição.' }
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
