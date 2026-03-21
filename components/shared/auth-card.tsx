'use client'

import Link from 'next/link'
import { Wallet } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  description: string
  error: string
  loading: boolean
  submitLabel: string
  loadingLabel: string
  footerText: string
  footerLinkText: string
  footerLinkHref: string
  onSubmit: (e: React.FormEvent) => void
  children: React.ReactNode
}

export function AuthCard({
  title,
  description,
  error,
  loading,
  submitLabel,
  loadingLabel,
  footerText,
  footerLinkText,
  footerLinkHref,
  onSubmit,
  children,
}: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-3">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 text-destructive text-sm p-3">
                {error}
              </div>
            )}
            {children}
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? loadingLabel : submitLabel}
            </Button>
            <p className="text-sm text-muted-foreground">
              {footerText}{' '}
              <Link href={footerLinkHref} className="text-primary hover:underline">
                {footerLinkText}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
