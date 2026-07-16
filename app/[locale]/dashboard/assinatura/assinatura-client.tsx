'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ArrowRight, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'

export function AssinaturaClient() {
  const t = useTranslations('dashboard.subscription')
  const tShared = useTranslations('dashboard.shared')
  const tPricing = useTranslations('marketing.pricing')
  const includedFeatures = tPricing.raw('features') as string[]
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const syncFailed = searchParams.get('checkout') === 'sync_failed'

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? t('checkoutError'))
      if (data.url) router.push(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-sm w-full">
        <div className="rounded-2xl border border-primary/20 bg-card shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-bl-full -translate-y-10 translate-x-10 pointer-events-none" />

          <div className="relative">
            {syncFailed && (
              <p className="text-sm text-destructive mb-4 bg-destructive/10 rounded-md px-3 py-2">
                {t('syncFailed')}
              </p>
            )}
            {/* Badge */}
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                {t('trialBadge')}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tighter text-foreground [font-family:var(--font-outfit)] mb-1">
              {t('activateTitle')}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {t('activateDescription')}
            </p>

            {/* Price */}
            <div className="flex items-end gap-1 mb-1">
              <span className="text-3xl font-bold tracking-tighter text-foreground [font-family:var(--font-outfit)]">
                {tShared('subscriptionPrice')}
              </span>
              <span className="text-muted-foreground pb-1 text-sm">{tShared('subscriptionPerMonth')}</span>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              {t('afterTrial')}
            </p>

            {/* Error */}
            {error && (
              <p className="text-sm text-destructive mb-4 bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            {/* CTA */}
            <Button
              className="w-full mb-3 group"
              size="lg"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tShared('subscriptionWait')}
                </>
              ) : (
                <>
                  {t('startTrial')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground mb-6">
              {tShared('subscriptionCancelAnytime')}
            </p>

            {/* Feature list */}
            <div className="space-y-2 border-t border-border pt-5">
              {includedFeatures.map((feature) => (
                <div key={feature} className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} />
                  </div>
                  <span className="text-xs text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
