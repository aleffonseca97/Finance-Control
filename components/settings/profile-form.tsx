'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateProfile, updatePassword } from '@/app/actions/profile'

interface ProfileFormProps {
  name: string | null
  email: string
}

function ProfileSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar'}
    </Button>
  )
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Alterando...' : 'Alterar senha'}
    </Button>
  )
}

export function ProfileForm({ name, email }: ProfileFormProps) {
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
      setPasswordError('As senhas não coincidem')
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
    <div className="space-y-6">
      <form
        action={handleProfileSubmit}
        className="space-y-4 p-4 rounded-lg border bg-card"
      >
        <h3 className="font-semibold">Perfil</h3>
        {profileError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-md">
            Perfil atualizado com sucesso
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              name="name"
              defaultValue={name ?? ''}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              placeholder="seu@email.com"
              required
            />
          </div>
        </div>
        <ProfileSubmitButton />
      </form>

      <form
        id="password-form"
        action={handlePasswordSubmit}
        className="space-y-4 p-4 rounded-lg border bg-card"
      >
        <h3 className="font-semibold">Alterar senha</h3>
        {passwordError && (
          <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="text-sm text-emerald-600 bg-emerald-500/10 p-3 rounded-md">
            Senha alterada com sucesso
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova senha</Label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
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
