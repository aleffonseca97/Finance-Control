'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { AuthCard } from '@/components/shared/auth-card'
import { register, type RegisterFieldErrors } from '@/app/actions/auth'
import { digitsOnly, formatCpfDisplay } from '@/lib/validation/br'

const DIAL_OPTIONS = [
  { code: '55', label: '+55 Brasil' },
  { code: '1', label: '+1 EUA' },
  { code: '39', label: '+39 Itália' },
] as const

function FieldError({
  message,
  id,
}: {
  message?: string
  id?: string
}) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-sm text-destructive">
      {message}
    </p>
  )
}

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
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({})
  const [loading, setLoading] = useState(false)

  function clearFieldError(key: keyof RegisterFieldErrors) {
    setFieldErrors((prev) => {
      if (prev[key] == null) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }
  const router = useRouter()

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearFieldError('cpf')
    setCpfDigits(digitsOnly(e.target.value).slice(0, 11))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFieldErrors({})
    if (password !== passwordConfirm) {
      setFieldErrors({ passwordConfirm: 'As senhas não coincidem' })
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

    if (result && 'errors' in result) {
      setFieldErrors(result.errors)
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
            onChange={(e) => {
              clearFieldError('firstName')
              setFirstName(e.target.value)
            }}
            autoComplete="given-name"
            required
            minLength={2}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.firstName)}
            aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
          />
          <FieldError id="firstName-error" message={fieldErrors.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Sobrenome</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Silva"
            value={lastName}
            onChange={(e) => {
              clearFieldError('lastName')
              setLastName(e.target.value)
            }}
            autoComplete="family-name"
            required
            minLength={2}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.lastName)}
            aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
          />
          <FieldError id="lastName-error" message={fieldErrors.lastName} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => {
            clearFieldError('email')
            setEmail(e.target.value)
          }}
          autoComplete="email"
          required
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        <FieldError id="email-error" message={fieldErrors.email} />
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
          aria-invalid={
            Boolean(fieldErrors.cpf) ||
            (cpfDigits.length > 0 && cpfDigits.length < 11)
          }
          aria-describedby={fieldErrors.cpf ? 'cpf-error' : undefined}
        />
        <FieldError id="cpf-error" message={fieldErrors.cpf} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phoneNational">Telefone</Label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Select
            id="phoneDial"
            name="phoneDial"
            value={phoneDial}
            onChange={(e) => {
              clearFieldError('phoneDial')
              clearFieldError('phoneNational')
              setPhoneDial(e.target.value)
            }}
            disabled={loading}
            className="sm:w-[11.5rem] shrink-0"
            aria-label="Código do país"
            aria-invalid={Boolean(fieldErrors.phoneDial)}
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
            onChange={(e) => {
              clearFieldError('phoneNational')
              setPhoneNational(e.target.value)
            }}
            autoComplete="tel-national"
            required
            disabled={loading}
            className="min-w-0 flex-1"
            aria-invalid={Boolean(fieldErrors.phoneNational)}
            aria-describedby={
              fieldErrors.phoneNational || fieldErrors.phoneDial
                ? 'phone-error'
                : undefined
            }
          />
        </div>
        <FieldError
          id="phone-error"
          message={
            fieldErrors.phoneNational ?? fieldErrors.phoneDial
          }
        />
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
          onChange={(e) => {
            clearFieldError('password')
            clearFieldError('passwordConfirm')
            setPassword(e.target.value)
          }}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={fieldErrors.password ? 'password-error' : undefined}
        />
        <FieldError id="password-error" message={fieldErrors.password} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">Confirmar senha</Label>
        <Input
          id="passwordConfirm"
          type="password"
          placeholder="Repita a senha"
          value={passwordConfirm}
          onChange={(e) => {
            clearFieldError('passwordConfirm')
            setPasswordConfirm(e.target.value)
          }}
          autoComplete="new-password"
          required
          minLength={6}
          disabled={loading}
          aria-invalid={Boolean(fieldErrors.passwordConfirm)}
          aria-describedby={
            fieldErrors.passwordConfirm ? 'passwordConfirm-error' : undefined
          }
        />
        <FieldError
          id="passwordConfirm-error"
          message={fieldErrors.passwordConfirm}
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
