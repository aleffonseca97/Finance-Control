'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatCurrency, formatDate } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'
import { useLocale, useTranslations } from 'next-intl'

type InvestmentItem = {
  id: string
  amount: number
  affectsCash?: boolean
  date: Date | string
  notes: string | null
  category: { name: string; color: string | null; icon: string } | null
  reserveCategory?: { name: string; color: string | null; icon: string } | null
  walletCategory?: { name: string; color: string | null; icon: string } | null
}

type Props = {
  title: string
  total: number
  investments: InvestmentItem[]
  emptyMessage: string
  onDelete: (id: string) => Promise<unknown>
}

export function InvestmentListCard({
  title,
  total,
  investments,
  emptyMessage,
  onDelete,
}: Props) {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const t = useTranslations('dashboard.shared')
  return (
    <Card className="dashboard-bento-card-muted overflow-hidden shadow-md">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className="text-xl font-bold text-blue-500 tabular-nums sm:text-2xl">
          {formatCurrency(total, locale, currency)}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {investments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {investments.map((inv) => {
              const displayCategory =
                inv.reserveCategory && inv.walletCategory
                  ? {
                      ...inv.reserveCategory,
                      name: `${localizeStoredLabel(inv.reserveCategory.name, locale)} → ${localizeStoredLabel(inv.walletCategory.name, locale)}`,
                    }
                  : inv.category
                    ? {
                        ...inv.category,
                        name: localizeStoredLabel(inv.category.name, locale),
                      }
                    : null
              const isWithdrawal = inv.amount < 0
              const isMonitoringDeposit = !isWithdrawal && inv.affectsCash === false

              return (
                <li
                  key={inv.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="shrink-0 rounded-full p-2"
                      style={{
                        backgroundColor: `${displayCategory?.color ?? '#6366f1'}20`,
                      }}
                    >
                      <CategoryIcon
                        icon={displayCategory?.icon ?? 'CircleDollarSign'}
                        className="text-foreground"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {displayCategory?.name ?? t('investmentDefault')}
                        {isWithdrawal && ` (${t('withdrawal')})`}
                      </p>
                      <p className="break-words text-sm text-muted-foreground">
                        {formatDate(inv.date, locale)}
                        {isMonitoringDeposit && ` • ${t('withoutCash')}`}
                        {inv.notes && ` • ${inv.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                    <span
                      className={`font-semibold tabular-nums ${isWithdrawal ? 'text-green-600' : 'text-blue-500'}`}
                    >
                      {isWithdrawal ? '+' : ''}
                      {formatCurrency(Math.abs(inv.amount), locale, currency)}
                      {isWithdrawal && ` (${t('balanceLabel')})`}
                    </span>
                    <DeleteConfirmButton
                      confirmMessage={t('deleteContribution')}
                      onDelete={() => onDelete(inv.id)}
                    />
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
