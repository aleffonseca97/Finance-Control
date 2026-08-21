'use client'

import type { SubscriptionsPageData } from '@/app/actions/analysis'
import { CategoryIcon } from '@/components/category/category-icon'
import { useCurrency } from '@/components/currency-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { AppLocale } from '@/i18n/routing'
import { formatCurrency, formatNumber } from '@/lib/i18n/format'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'
import { Check, Repeat } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

type Props = {
  data: SubscriptionsPageData
}

export function AssinaturasContent({ data }: Props) {
  const t = useTranslations('dashboard.subscriptionsAnalysis')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="dashboard-bento-card-hero shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('monthlyTotal')}</CardTitle>
            <CardDescription>{t('monthlyTotalHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {formatCurrency(data.monthlyTotal, locale, currency)}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('count')}</CardTitle>
            <CardDescription>{t('countHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {data.count}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">{t('ofIncome')}</CardTitle>
            <CardDescription>{t('ofIncomeHint')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
              {data.incomeSharePercent != null
                ? t('ofIncomeValue', {
                    percent: formatNumber(data.incomeSharePercent, locale),
                  })
                : t('ofIncomeUnavailable')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
            {t('listTitle')}
          </CardTitle>
          <CardDescription>{t('listHint')}</CardDescription>
        </CardHeader>
        <CardContent>
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-muted-foreground">{t('empty')}</p>
              <Button asChild variant="outline" className="min-h-11 gap-2">
                <Link href="/dashboard/pagamentos-recorrentes">
                  <Repeat className="h-4 w-4" aria-hidden />
                  {t('emptyCta')}
                </Link>
              </Button>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((item) => {
                const color = item.categoryColor ?? '#7c3aed'
                return (
                  <li
                    key={item.id}
                    className={cn(
                      'dashboard-bento-card-muted flex flex-col gap-3 rounded-xl border p-4',
                      'transition-[border-color,background-color] duration-200',
                      'hover:border-primary/25 hover:bg-muted/50',
                      item.paid && 'border-emerald-500/25 bg-emerald-500/[0.06] dark:bg-emerald-500/10',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}22`, color }}
                        aria-hidden
                      >
                        <CategoryIcon icon={item.categoryIcon} size={22} />
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-semibold leading-snug">
                          {localizeStoredLabel(item.categoryName, locale)}
                        </p>
                        {item.categoryGroup ? (
                          <p className="text-xs text-muted-foreground">
                            {localizeStoredLabel(item.categoryGroup, locale)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-2 pt-1">
                      <p className="text-lg font-bold tabular-nums tracking-tight">
                        {formatCurrency(item.amount, locale, currency)}
                      </p>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
                          item.paid
                            ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {item.paid ? (
                          <>
                            <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                            {t('paid')}
                          </>
                        ) : (
                          t('pending')
                        )}
                      </span>
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
