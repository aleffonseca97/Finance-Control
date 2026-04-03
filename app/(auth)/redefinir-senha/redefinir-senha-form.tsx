'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
            <CardTitle className="text-2xl">Link inválido</CardTitle>
            <CardDescription>
              Abra o link enviado por e-mail ou solicite uma nova redefinição de
              senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              role="alert"
              className="rounded-md bg-destructive/10 text-destructive text-sm p-3 leading-relaxed"
            >
              Token ausente ou inválido.
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Link
              href="/esqueci-senha"
              className={cn(buttonVariants(), 'w-full text-center')}
            >
              Solicitar novo link
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: 'outline' }),
                'w-full text-center'
              )}
            >
              Voltar ao login
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
      setError('As senhas não coincidem')
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
      setNotice('Senha alterada com sucesso. Redirecionando para o login…')
      setTimeout(() => {
        router.push('/login')
        router.refresh()
      }, 1500)
    }
  }

  return (
    <AuthCard
      title="Nova senha"
      description="Escolha uma nova senha para sua conta"
      error={error}
      notice={notice}
      loading={loading}
      submitLabel="Salvar nova senha"
      loadingLabel="Salvando..."
      footerText="Voltar ao"
      footerLinkText="login"
      footerLinkHref="/login"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input
          id="newPassword"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          disabled={loading || !!notice}
        />
      </div>
    </AuthCard>
  )
}
