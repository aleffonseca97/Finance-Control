'use client';

import { useState } from 'react';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/lib/i18n/navigation';
import { getDashboardRedirect } from '@/app/actions/locale';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthCard } from '@/components/shared/auth-card';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const tPlaceholders = useTranslations('auth.placeholders');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

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
      setError(t('invalidCredentials'));
      return;
    }

    // Prefer the locale stored on the user (DB), remapping any callbackUrl prefix.
    const { locale, href } = await getDashboardRedirect(callbackUrl);
    // Full path avoids next-intl quirks with query strings on replace().
    window.location.assign(`/${locale}${href}`);
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
      title={t('title')}
      description={t('description')}
      error={error}
      loading={loading}
      submitLabel={t('submit')}
      loadingLabel={t('submitting')}
      footerText={t('noAccount')}
      footerLinkText={t('register')}
      footerLinkHref="/registro"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <Label htmlFor="email">{t('email')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={tPlaceholders('email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t('password')}</Label>
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
            {t('forgotPassword')}
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
