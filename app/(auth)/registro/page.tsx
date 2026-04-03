'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthCard } from '@/components/shared/auth-card'
import { register } from '@/app/actions/auth'

export default function RegistroPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData()
    formData.set('name', name)
    formData.set('email', email)
    formData.set('password', password)
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
      title="Criar conta"
      description="Cadastre-se para controlar suas finanças"
      error={error}
      loading={loading}
      submitLabel="Cadastrar"
      loadingLabel="Cadastrando..."
      footerText="Já tem conta?"
      footerLinkText="Entrar"
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          placeholder="Seu nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
          Quero receber e-mails sobre novidades e melhorias do Logos Finance
          (opcional).
        </Label>
      </div>
    </AuthCard>
  )
}
