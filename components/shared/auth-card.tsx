'use client';

import Link from 'next/link';
import { Wallet } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  description: string;
  error: string;
  /** Mensagem de sucesso ou informação (ex.: e-mail de recuperação enviado). */
  notice?: string;
  loading: boolean;
  submitLabel: string;
  loadingLabel: string;
  footerText: string;
  footerLinkText: string;
  footerLinkHref: string;
  onSubmit: (e: React.FormEvent) => void;
  children: React.ReactNode;
  /** When set, replaces the default wallet icon in the header. */
  logo?: React.ReactNode;
};

export function AuthCard({
  title,
  description,
  error,
  notice,
  loading,
  submitLabel,
  loadingLabel,
  footerText,
  footerLinkText,
  footerLinkHref,
  onSubmit,
  children,
  logo,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            {logo ? (
              <div className="flex w-full max-w-xs justify-center px-2">{logo}</div>
            ) : (
              <div className="rounded-full bg-primary/10 p-3">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div
                role="alert"
                className="rounded-md bg-destructive/10 text-destructive text-sm p-3 leading-relaxed"
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-sm p-3 leading-relaxed"
              >
                {notice}
              </div>
            )}
            {children}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? loadingLabel : submitLabel}
            </Button>
            {(footerText || footerLinkText) && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {footerText}
                {footerText && footerLinkText ? ' ' : null}
                {footerLinkText ? (
                  <Link
                    href={footerLinkHref}
                    className="text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
                  >
                    {footerLinkText}
                  </Link>
                ) : null}
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
