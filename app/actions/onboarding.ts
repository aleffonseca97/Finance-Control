'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { revalidateLocalePaths } from '@/lib/i18n/revalidate'
import { getErrorTranslations } from '@/lib/i18n/validation'

export async function isNewUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasSeenWelcome: true },
  })
  return !user?.hasSeenWelcome
}

export async function markWelcomeComplete() {
  const session = await auth()
  const t = await getErrorTranslations()
  if (!session?.user?.id) return { error: t('unauthorized') }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenWelcome: true },
  })

  await revalidateLocalePaths(['/dashboard', '/dashboard/boas-vindas'])
  return { success: true }
}
