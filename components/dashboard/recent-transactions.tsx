'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { CategoryIcon } from '@/components/category/category-icon'
import { formatCurrency, formatDate } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'
import type { TransactionWithCategory } from '@/lib/transaction-types'

export function RecentTransactions({ transactions }: { transactions: TransactionWithCategory[] }) {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const t = useTranslations('dashboard.shared')

  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        {t('noRecentTransactions')}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((tx) => (
        <Link
          key={tx.id}
          href={tx.type === 'income' ? '/dashboard/entradas' : '/dashboard/saidas'}
          className="flex items-center justify-between gap-2 rounded-lg border border-transparent p-2.5 transition-colors hover:border-border/80 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="flex items-center gap-2">
            <div
              className="rounded-full p-1.5"
              style={{ backgroundColor: `${tx.category.color}20` }}
            >
              <CategoryIcon icon={tx.category.icon} size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{localizeStoredLabel(tx.category.name, locale)}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(tx.date, locale)}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-medium ${
              tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {tx.type === 'income' ? '+' : '-'}{' '}
            {formatCurrency(tx.amount, locale, currency)}
          </span>
        </Link>
      ))}
    </div>
  )
}
