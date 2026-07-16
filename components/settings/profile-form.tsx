'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, updatePassword } from '@/app/actions/profile'

interface ProfileFormProps {
  name: string | null
  email: string
  marketingOptIn: boolean
}

function ProfileSubmitButton() {
  const t = useTranslations('settings.profile')
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t('saving') : t('save')}
    </Button>
  )
}

function PasswordSubmitButton() {
  const t = useTranslations('settings.profile')
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t('changing') : t('changePassword')}
    </Button>
  )
}

export function ProfileForm({
  name,
  email,
  marketingOptIn,
}: ProfileFormProps) {
  const t = useTranslations('settings.profile')
  const tPlaceholders = useTranslations('auth.placeholders')
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  async function handleProfileSubmit(formData: FormData) {
    setProfileError('')
    setProfileSuccess(false)
    const result = await updateProfile(formData)
    if (result?.error) {
      setProfileError(result.error)
    } else if (result?.success) {
      setProfileSuccess(true)
    }
  }

  async function handlePasswordSubmit(formData: FormData) {
    setPasswordError('')
    setPasswordSuccess(false)
    const newPassword = formData.get('newPassword')
    const confirmPassword = formData.get('confirmPassword')
    if (newPassword !== confirmPassword) {
      setPasswordError(t('passwordMismatch'))
      return
    }
    const result = await updatePassword(formData)
    if (result?.error) {
      setPasswordError(result.error)
    } else if (result?.success) {
      setPasswordSuccess(true)
      ;(document.getElementById('password-form') as HTMLFormElement)?.reset()
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
      <form
        action={handleProfileSubmit}
        className="space-y-4 p-4 rounded-lg border bg-card"
      >
        <h3 className="font-semibold">{t('sectionTitle')}</h3>
        {profileError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-md">
            {t('profileUpdated')}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              name="name"
              defaultValue={name ?? ''}
              placeholder={t('namePlaceholder')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('email')}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              placeholder={tPlaceholders('email')}
              required
            />
          </div>
        </div>
        <div className="flex items-start gap-2">
          <input
            id="marketingOptIn"
            name="marketingOptIn"
            type="checkbox"
            defaultChecked={marketingOptIn}
            className="mt-1 size-4 rounded border-input"
          />
          <Label
            htmlFor="marketingOptIn"
            className="text-sm font-normal text-muted-foreground leading-snug cursor-pointer"
          >
            {t('marketingOptIn')}
          </Label>
        </div>
        <ProfileSubmitButton />
      </form>

      <form
        id="password-form"
        action={handlePasswordSubmit}
        className="space-y-4 p-4 rounded-lg border bg-card"
      >
        <h3 className="font-semibold">{t('passwordSectionTitle')}</h3>
        {passwordError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-md">
            {t('passwordUpdated')}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder={t('passwordPlaceholder')}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">{t('newPassword')}</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder={t('passwordPlaceholder')}
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="confirmPassword">{t('confirmPassword')}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder={t('passwordPlaceholder')}
              minLength={6}
              required
            />
          </div>
        </div>
        <PasswordSubmitButton />
      </form>
    </div>
  )
}
