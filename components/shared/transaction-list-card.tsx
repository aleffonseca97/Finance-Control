'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatCurrency, formatDate } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

type TransactionItem = {
  id: string
  amount: number
  description: string | null
  date: Date | string
  category: { name: string; color: string | null; icon: string }
  creditCard?: { name: string; lastFour: string | null } | null
}

type Props = {
  title: string
  total: number
  items: TransactionItem[]
  emptyMessage: string
  colorClass: string
  onDelete: (id: string) => Promise<unknown>
  deleteConfirmMessage: string
}

export function TransactionListCard({
  title,
  total,
  items,
  emptyMessage,
  colorClass,
  onDelete,
  deleteConfirmMessage,
}: Props) {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const t = useTranslations('dashboard.shared')

  return (
    <Card className="dashboard-bento-card-muted overflow-hidden shadow-md">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className={`text-xl font-bold tabular-nums sm:text-2xl ${colorClass}`}>
          {formatCurrency(total, locale, currency)}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className="shrink-0 rounded-full p-2"
                    style={{ backgroundColor: `${item.category.color}20` }}
                  >
                    <CategoryIcon
                      icon={item.category.icon}
                      className="text-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{localizeStoredLabel(item.category.name, locale)}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {item.description || formatDate(item.date, locale)}
                      {item.creditCard && (
                        <span className="text-amber-600 dark:text-amber-500">
                          {' '}• {t('cardPrefix')} {item.creditCard.name}
                          {item.creditCard.lastFour
                            ? ` •••• ${item.creditCard.lastFour}`
                            : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                  <span className={`font-semibold tabular-nums ${colorClass}`}>
                    {formatCurrency(item.amount, locale, currency)}
                  </span>
                  <DeleteConfirmButton
                    confirmMessage={deleteConfirmMessage}
                    onDelete={() => onDelete(item.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
