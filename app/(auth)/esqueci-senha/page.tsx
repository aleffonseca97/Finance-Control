'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/shared/auth-card'
import { requestPasswordReset } from '@/app/actions/password-reset'

export default function EsqueciSenhaPage() {
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
      title="Esqueci minha senha"
      description="Informe seu e-mail e enviaremos um link para redefinir a senha"
      error={error}
      notice={notice}
      loading={loading}
      submitLabel="Enviar instruções"
      loadingLabel="Enviando..."
      footerText="Lembrou a senha?"
      footerLinkText="Voltar ao login"
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
    </AuthCard>
  )
}
