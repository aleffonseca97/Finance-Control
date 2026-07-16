'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

type CreditCardTransaction = {
  id: string
  amount: number
  description: string | null
  category: { name: string; color: string; icon: string }
  creditCard?: { name: string; lastFour: string | null } | null
}

type Props = {
  total: number
  transactions: CreditCardTransaction[]
}

export function CreditCardSpending({ total, transactions }: Props) {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const t = useTranslations('dashboard.shared')

  return (
    <Card className="dashboard-bento-card-muted lg:min-w-[320px] shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{t('creditCardSpendingTitle')}</CardTitle>
        <CreditCard className="h-5 w-5 text-amber-500 shrink-0" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold text-amber-600">
          {formatCurrency(total, locale, currency)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('creditCardSpendingHint')}
        </p>
        {transactions.length > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              {t('recentCreditCardSpending')}
            </p>
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-2 py-1.5 rounded-md hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="rounded-full p-1.5 shrink-0"
                    style={{ backgroundColor: `${tx.category.color}20` }}
                  >
                    <CategoryIcon icon={tx.category.icon} size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tx.description || localizeStoredLabel(tx.category.name, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.creditCard?.name}
                      {tx.creditCard?.lastFour
                        ? ` •••• ${tx.creditCard.lastFour}`
                        : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500 shrink-0">
                  {formatCurrency(tx.amount, locale, currency)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2">
            {t('noCreditCardSpending')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
