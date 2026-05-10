'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AuthCard } from '@/components/shared/auth-card'
import { register } from '@/app/actions/auth'
import { digitsOnly, formatCpfDisplay } from '@/lib/validation/br'

const DIAL_OPTIONS = [
  { code: '55', label: '+55 Brasil' },
  { code: '1', label: '+1 EUA' },
  { code: '39', label: '+39 Itália' },
] as const

export default function RegistroPage() {
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
      setError('As senhas não coincidem')
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
      className="max-w-lg"
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Nome</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Maria"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
            required
            minLength={2}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Silva"
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
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <Input
          id="cpf"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="000.000.000-00"
          value={formatCpfDisplay(cpfDigits)}
          onChange={handleCpfChange}
          required
          disabled={loading}
          aria-invalid={cpfDigits.length > 0 && cpfDigits.length < 11}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNational">Telefone</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Select
            id="phoneDial"
            name="phoneDial"
            value={phoneDial}
            onChange={(e) => setPhoneDial(e.target.value)}
            disabled={loading}
            className="sm:w-[11.5rem] shrink-0"
            aria-label="Código do país"
          >
            {DIAL_OPTIONS.map((o) => (
              <option key={o.code} value={o.code}>
                {o.label}
              </option>
            ))}
          </Select>
          <Input
            id="phoneNational"
            type="tel"
            inputMode="tel"
            placeholder={phoneDial === '55' ? '(11) 99999-9999' : 'Número com DDD'}
            value={phoneNational}
            onChange={(e) => setPhoneNational(e.target.value)}
            autoComplete="tel-national"
            required
            disabled={loading}
            className="min-w-0 flex-1"
          />
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          Inclua o DDD. Para o Brasil, use 11 dígitos (celular) ou 10 (fixo).
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          placeholder="Mínimo 6 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Confirmar senha</Label>
        <Input
          id="passwordConfirm"
          type="password"
          placeholder="Repita a senha"
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
          Quero receber e-mails sobre novidades e melhorias do Logos Finance
          (opcional).
        </Label>
      </div>
    </AuthCard>
  )
}
