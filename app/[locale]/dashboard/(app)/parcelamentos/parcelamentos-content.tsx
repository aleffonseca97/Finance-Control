'use client'

import type {
  InstallmentPlansPageData,
} from '@/app/actions/installment-plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'
import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency, formatDate } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'
import { CreditCard } from 'lucide-react'

const MONTH_SHORT_KEYS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
] as const

type Props = {
  data: InstallmentPlansPageData
}

export function ParcelamentosContent({ data }: Props) {
  const t = useTranslations('dashboard.installmentsAnalysis')
  const tMonths = useTranslations('common.monthsShort')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()

  const peakMonthLabel =
    data.peakMonthIndex >= 0 ? tMonths(MONTH_SHORT_KEYS[data.peakMonthIndex]) : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dashboard-bento-card-hero shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('totalYear')}</CardTitle>
            <CardDescription>{t('totalYearHint', { year: data.year })}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(data.totalRemainingInYear, locale, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('peakMonth')}</CardTitle>
            <CardDescription>{t('peakMonthHint', { year: data.year })}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(data.peakMonthAmount, locale, currency)}
            </p>
            {peakMonthLabel && data.peakMonthAmount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('peakMonthIn', { month: peakMonthLabel })}
              </p>
            ) : null}
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('monthlyCommitment')}</CardTitle>
            <CardDescription>{t('monthlyCommitmentHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(data.activeMonthlyCommitment, locale, currency)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-bento-card-muted min-w-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">{t('monthlyDistribution')}</CardTitle>
          <CardDescription>{t('monthlyDistributionHint')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.monthlyTotals.map((amount, i) => (
              <div
                key={MONTH_SHORT_KEYS[i]}
                className={cn(
                  'flex min-h-[4.25rem] min-w-0 flex-col justify-center rounded-lg border px-3 py-2.5 sm:min-h-[4.5rem] sm:px-3.5 sm:py-3',
                  amount > 0 ? 'border-primary/25 bg-primary/5' : 'border-border/60 bg-muted/30',
                  data.peakMonthIndex === i && amount > 0 && 'ring-1 ring-primary/40',
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-[0.8125rem]">
                  {tMonths(MONTH_SHORT_KEYS[i])}
                </p>
                <p className="mt-1 min-w-0 break-words text-sm font-semibold tabular-nums leading-snug sm:text-base">
                  {amount > 0 ? (
                    formatCurrency(amount, locale, currency)
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.byCard.length > 0 ? (
        <Card className="dashboard-bento-card min-w-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('byCard')}</CardTitle>
            <CardDescription>{t('byCardHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3 sm:grid-cols-2">
              {data.byCard.map((card) => (
                <li
                  key={card.creditCardId}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3"
                >
                  <span
                    className="mt-1 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: card.creditCardColor ?? '#6366f1' }}
                    aria-hidden
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold leading-snug">
                      {card.creditCardName}
                      {card.creditCardLastFour ? (
                        <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                          •••• {card.creditCardLastFour}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('activePlans', { count: card.activePlanCount })}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-sm">
                      <p>
                        <span className="text-muted-foreground">{t('monthlyCommitment')}: </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(card.activeMonthlyCommitment, locale, currency)}
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">{t('inYear', { year: data.year })}: </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(card.remainingAmountInYear, locale, currency)}
                        </span>
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
            {t('plansTitle')}
          </CardTitle>
          <CardDescription>{t('plansHint')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.plans.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/cartao-credito">
                  <CreditCard className="h-4 w-4" />
                  {t('emptyCta')}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="divide-y rounded-lg border">
              {data.plans.map((row) => {
                const progress =
                  row.totalInstallments > 0
                    ? (row.paidInstallments / row.totalInstallments) * 100
                    : 0
                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold leading-snug">{row.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {row.creditCardName}
                          {row.creditCardLastFour ? ` •••• ${row.creditCardLastFour}` : ''}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(row.monthlyAmount, locale, currency)}
                        {' · '}
                        {t('progressPaid', {
                          paid: row.paidInstallments,
                          total: row.totalInstallments,
                        })}
                        {row.remainingInstallments === 0
                          ? ` · ${t('completed')}`
                          : null}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('firstInstallment', {
                          date: formatDate(
                            `${row.firstInstallmentDate}T12:00:00.000Z`,
                            locale,
                          ),
                        })}
                      </p>
                      <div className="h-1.5 max-w-xs rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(100, progress)}%`,
                            backgroundColor: row.creditCardColor ?? '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('inYear', { year: data.year })}
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        {formatCurrency(row.remainingAmountInYear, locale, currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('remainingCount', { count: row.remainingDueInYear })}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
