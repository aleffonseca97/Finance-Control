import { AlertTriangle } from 'lucide-react'
import { getTranslations, getLocale } from 'next-intl/server'
import type { SerializedCreditCardOverdue } from '@/app/actions/credit-cards'
import { formatCurrency } from '@/lib/i18n/format'
import { getCurrentCurrency } from '@/lib/i18n/get-currency'
import type { AppLocale } from '@/i18n/routing'

type Props = {
  notices: SerializedCreditCardOverdue[]
}

export async function OverdueBanner({ notices }: Props) {
  if (notices.length === 0) return null

  const [t, locale, currency] = await Promise.all([
    getTranslations('dashboard.creditCard'),
    getLocale(),
    getCurrentCurrency(),
  ])
  const appLocale = locale as AppLocale

  return (
    <div
      role="status"
      className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="font-semibold text-destructive">
          {t('overdueTitle')}
        </p>
        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
          {notices.map((n) => (
            <li key={`${n.cardId}-${n.closingLabel}`}>
              {t('overdueItem', {
                cardName: n.cardName,
                lastFour: n.lastFour ? ` •••• ${n.lastFour}` : '',
                amount: formatCurrency(n.unpaid, appLocale, currency),
                dueDate: n.dueDateLabel,
                closingDate: n.closingLabel,
              })}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
