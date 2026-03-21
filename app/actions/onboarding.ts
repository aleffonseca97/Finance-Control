'use server'

import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function isNewUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hasSeenWelcome: true },
  })
  return !user?.hasSeenWelcome
}

export async function markWelcomeComplete() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Não autorizado' }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasSeenWelcome: true },
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/boas-vindas')
  return { success: true }
}
