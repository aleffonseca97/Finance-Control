'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/lib/i18n/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AuthCard } from '@/components/shared/auth-card'
import { register } from '@/app/actions/auth'
import { digitsOnly, formatCpfDisplay } from '@/lib/validation/br'

const DIAL_CODES = ['55', '351', '1', '34', '44'] as const

export default function RegistroPage() {
  const t = useTranslations('auth.register')
  const tPlaceholders = useTranslations('auth.placeholders')
  const tDialCodes = useTranslations('auth.dialCodes')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [cpfDigits, setCpfDigits] = useState('')
  const [phoneDial, setPhoneDial] = useState('55')
  const [phoneNational, setPhoneNational] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpfDigits(digitsOnly(e.target.value).slice(0, 11))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError(t('passwordMismatch'))
      return
    }
    setLoading(true)

    const formData = new FormData()
    formData.set('firstName', firstName)
    formData.set('lastName', lastName)
    formData.set('email', email)
    formData.set('cpf', cpfDigits)
    formData.set('phoneDial', phoneDial)
    formData.set('phoneNational', phoneNational)
    formData.set('password', password)
    formData.set('passwordConfirm', passwordConfirm)
    if (marketingOptIn) {
      formData.set('marketingOptIn', 'on')
    }

    const result = await register(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    const signInResult = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (signInResult?.error) {
      router.push('/login')
      router.refresh()
      return
    }

    router.push('/dashboard/boas-vindas')
    router.refresh()
  }

  return (
    <AuthCard
      title={t('title')}
      description={t('description')}
      error={error}
      loading={loading}
      submitLabel={t('submit')}
      loadingLabel={t('submitting')}
      footerText={t('hasAccount')}
      footerLinkText={t('signIn')}
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t('firstName')}</Label>
          <Input
            id="firstName"
            type="text"
            placeholder={tPlaceholders('firstName')}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
            minLength={2}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t('lastName')}</Label>
          <Input
            id="lastName"
            type="text"
            placeholder={tPlaceholders('lastName')}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
            minLength={2}
            disabled={loading}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tPlaceholders('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cpf">{t('cpf')}</Label>
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder={tPlaceholders('cpf')}
          value={formatCpfDisplay(cpfDigits)}
          onChange={handleCpfChange}
          required
          disabled={loading}
          aria-invalid={cpfDigits.length > 0 && cpfDigits.length < 11}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNational">{t('phone')}</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Select
            id="phoneDial"
            name="phoneDial"
            value={phoneDial}
            onChange={(e) => setPhoneDial(e.target.value)}
            disabled={loading}
            className="sm:w-[11.5rem] shrink-0"
            aria-label={t('countryCode')}
          >
            {DIAL_CODES.map((code) => (
              <option key={code} value={code}>
                {tDialCodes(code)}
              </option>
            ))}
          </Select>
          <Input
            id="phoneNational"
            type="tel"
            inputMode="tel"
            placeholder={phoneDial === '55' ? tPlaceholders('phoneBr') : tPlaceholders('phoneIntl')}
            value={phoneNational}
            onChange={(e) => setPhoneNational(e.target.value)}
            autoComplete="tel-national"
            required
            disabled={loading}
            className="min-w-0 flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          {t('phoneHint')}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
        <Input
          id="password"
          type="password"
          placeholder={tPlaceholders('passwordMin')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">{t('passwordConfirm')}</Label>
        <Input
          id="passwordConfirm"
          type="password"
          placeholder={tPlaceholders('passwordRepeat')}
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="marketingOptIn"
          name="marketingOptIn"
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          disabled={loading}
          className="mt-1 size-4 rounded border-input"
        />
        <Label
          htmlFor="marketingOptIn"
          className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
        >
          {t('marketingOptIn')}
        </Label>
      </div>
    </AuthCard>
  )
}
