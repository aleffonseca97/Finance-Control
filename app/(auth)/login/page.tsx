'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthCard } from '@/components/shared/auth-card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Email ou senha inválidos');
      return;
    }

    router.push(callbackUrl);
  }

  return (
    <AuthCard
      logo={
        <Image
          src="/logosfinance-logomarca.png"
          alt="Logos Finance"
          width={320}
          height={100}
          className="h-auto w-full max-h-20 object-contain object-center"
          priority
        />
      }
      title=""
      description="Entre com sua conta"
      error={error}
      loading={loading}
      submitLabel="Entrar"
      loadingLabel="Entrando..."
      footerText="Não tem conta?"
      footerLinkText="Cadastre-se"
      footerLinkHref="/registro"
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
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <p className="text-sm text-right">
          <Link
            href="/esqueci-senha"
            className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
          >
            Esqueci minha senha
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
