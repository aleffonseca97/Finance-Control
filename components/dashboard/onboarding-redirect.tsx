'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from '@/lib/i18n/navigation'

interface OnboardingRedirectProps {
  hasSeenWelcome: boolean
  children: React.ReactNode
}

export function OnboardingRedirect({
  hasSeenWelcome,
  children,
}: OnboardingRedirectProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const isBoasVindas = pathname === '/dashboard/boas-vindas'
    const isAssinatura = pathname === '/dashboard/assinatura'

    if (!hasSeenWelcome && !isBoasVindas && !isAssinatura) {
      router.replace('/dashboard/boas-vindas')
      return
    }

    if (hasSeenWelcome && isBoasVindas) {
      router.replace('/dashboard')
    }
  }, [hasSeenWelcome, pathname, router])

  return <>{children}</>
}
