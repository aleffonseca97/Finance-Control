'use client'

import { useRouter } from '@/lib/i18n/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { markWelcomeComplete } from '@/app/actions/onboarding'
import { useTranslations } from 'next-intl'

export function ContinuarButton() {
  const router = useRouter()
  const t = useTranslations('dashboard.onboarding')
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const result = await markWelcomeComplete()
    if (result?.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading} size="lg">
      {loading ? t('continuing') : t('continue')}
    </Button>
  )
}
