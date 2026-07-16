'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/shared/auth-card'
import { requestPasswordReset } from '@/app/actions/password-reset'

export default function EsqueciSenhaPage() {
  const t = useTranslations('auth.forgotPassword')
  const tPlaceholders = useTranslations('auth.placeholders')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    setLoading(true)

    const formData = new FormData()
    formData.set('email', email)

    const result = await requestPasswordReset(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    if (result?.success && result.message) {
      setNotice(result.message)
    }
  }

  return (
    <AuthCard
      title={t('title')}
      description={t('description')}
      error={error}
      notice={notice}
      loading={loading}
      submitLabel={t('submit')}
      loadingLabel={t('submitting')}
      footerText={t('remembered')}
      footerLinkText={t('backToLogin')}
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tPlaceholders('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
    </AuthCard>
  )
}
