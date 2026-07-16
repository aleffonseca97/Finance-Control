'use client'

import { useLocale, useTranslations } from 'next-intl'
import { getMonthTitle } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'

type Props = {
  year: number
  month: number
  selectedDay: number
  colorClass: string
  iconColorClass: string
}

export function DateBanner({ year, month, selectedDay, colorClass, iconColorClass }: Props) {
  const locale = useLocale() as AppLocale
  const t = useTranslations('dashboard.shared')

  return (
    <div className={`rounded-xl border px-4 py-3 ${colorClass}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('transactionDate')}
      </p>
      <p className={`text-lg font-semibold capitalize ${iconColorClass}`}>
        {getMonthTitle(year, month, locale)} {selectedDay}, {year}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {t('changeDayInCalendar')}
      </p>
    </div>
  )
}
