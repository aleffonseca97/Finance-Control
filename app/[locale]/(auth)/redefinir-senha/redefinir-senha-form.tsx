'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '@/lib/i18n/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { AuthCard } from '@/components/shared/auth-card'
import { resetPasswordWithToken } from '@/app/actions/password-reset'

type Props = {
  token: string
}

export function RedefinirSenhaForm({ token }: Props) {
  const t = useTranslations('auth.resetPassword')
  const tPlaceholders = useTranslations('auth.placeholders')
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl">{t('invalidLinkTitle')}</CardTitle>
            <CardDescription>{t('invalidLinkDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="alert"
              className="rounded-md bg-destructive/10 text-destructive text-sm p-3 leading-relaxed"
            >
              {t('invalidToken')}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link
              href="/esqueci-senha"
              className={cn(buttonVariants(), 'w-full text-center')}
            >
              {t('requestNewLink')}
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'w-full text-center'
              )}
            >
              {t('backToLogin')}
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')

    if (password !== confirm) {
      setError(t('passwordMismatch'))
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.set('token', token)
    formData.set('newPassword', password)

    const result = await resetPasswordWithToken(formData)
    setLoading(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    if (result?.success) {
      setNotice(t('successRedirect'))
      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1500)
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
      footerText={t('footerText')}
      footerLinkText={t('footerLink')}
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="newPassword">{t('newPassword')}</Label>
        <Input
          id="newPassword"
          type="password"
          minLength={6}
          placeholder={tPlaceholders('passwordMin')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
        <Input
          id="confirmPassword"
          type="password"
          minLength={6}
          placeholder={tPlaceholders('passwordRepeat')}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
    </AuthCard>
  )
}
