'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'

type SubscriptionData = {
  status: string
  currentPeriodEnd: Date
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
} | null

interface SubscriptionSectionProps {
  stripeCustomerId: string | null
  subscription: SubscriptionData
}

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
  }).format(new Date(date))
}

export function SubscriptionSection({
  stripeCustomerId,
  subscription,
}: SubscriptionSectionProps) {
  const t = useTranslations('settings.subscription')
  const locale = useLocale()
  const [loadingAction, setLoadingAction] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState('')

  const isActiveOrTrialing = useMemo(() => {
    return subscription ? ['trialing', 'active'].includes(subscription.status) : false
  }, [subscription])

  const nextBillingDate = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd, locale)
    : null
  const trialEndDate = subscription?.trialEnd ? formatDate(subscription.trialEnd, locale) : null

  function getStatusLabel(status?: string) {
    if (!status) return t('statusLabels.none')
    switch (status) {
      case 'trialing':
        return t('statusLabels.trialing')
      case 'active':
        return t('statusLabels.active')
      case 'past_due':
        return t('statusLabels.past_due')
      case 'canceled':
        return t('statusLabels.canceled')
      case 'unpaid':
        return t('statusLabels.unpaid')
      case 'incomplete':
        return t('statusLabels.incomplete')
      default:
        return status
    }
  }

  async function openBillingFlow(action: 'checkout' | 'portal') {
    try {
      setError('')
      setLoadingAction(action)
      const endpoint = action === 'checkout' ? '/api/billing/checkout' : '/api/billing/portal'
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? t('billingError'))
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unexpectedError'))
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <section className="dashboard-bento-card-muted space-y-5 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">{t('title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('status')}</p>
          <p className="mt-1 text-sm font-medium">{getStatusLabel(subscription?.status)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('plan')}</p>
          <p className="mt-1 text-sm font-medium">{t('planName')}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            {subscription?.status === 'trialing' ? t('trialEnd') : t('nextRenewal')}
          </p>
          <p className="mt-1 text-sm font-medium">{trialEndDate ?? nextBillingDate ?? '-'}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">{t('price')}</p>
          <p className="mt-1 text-sm font-medium">{t('priceValue')}</p>
        </div>
      </div>

      {subscription?.cancelAtPeriodEnd && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          {t('cancelAtPeriodEnd')}
        </div>
      )}

      {!subscription && (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {t('noSubscription')}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {isActiveOrTrialing && stripeCustomerId ? (
          <Button
            type="button"
            onClick={() => openBillingFlow('portal')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'portal' ? t('manageOpening') : t('manage')}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => openBillingFlow('checkout')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'checkout' ? t('activateRedirecting') : t('activate')}
          </Button>
        )}

        {stripeCustomerId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => openBillingFlow('portal')}
            disabled={loadingAction !== null}
          >
            {t('billingPortal')}
          </Button>
        )}
      </div>
    </section>
  )
}
