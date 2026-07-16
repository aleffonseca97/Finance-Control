'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/lib/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { AppLocale } from '@/i18n/routing'

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

type Props = {
  year: number
  month: number
  daysInMonth: number
  selectedDay: number
  daysWithEntries: number[]
  todayYear: number
  todayMonth: number
  todayDay: number
  accentColor?: string
  entryLabel?: string
}

export function MonthCalendar({
  year,
  month,
  daysInMonth,
  selectedDay,
  daysWithEntries,
  todayYear,
  todayMonth,
  todayDay,
  accentColor = 'emerald',
  entryLabel,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale() as AppLocale
  const t = useTranslations('dashboard.shared')
  const tWeekdays = useTranslations('common.weekdays')
  const resolvedEntryLabel = entryLabel ?? t('withEntry')
  const entriesSet = new Set(daysWithEntries)

  function selectDay(day: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(month))
    params.set('year', String(year))
    params.set('day', String(day))
    router.push(`${pathname}?${params.toString()}`)
  }

  const firstWeekday = new Date(year, month, 1).getDay()
  const cells: (number | null)[] = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number) =>
    todayYear === year && todayMonth === month && todayDay === day

  const ringClass = `ring-1 ring-${accentColor}-500/45 dark:ring-${accentColor}-400/40`
  const dotClass = `bg-${accentColor}-500`

  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('selectDay')}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-muted-foreground sm:gap-1.5 sm:text-xs">
        {WEEKDAY_KEYS.map((key) => {
          const label = tWeekdays(key)
          return (
            <div key={key} className="py-1">
              <span className="sr-only sm:not-sr-only">{label}</span>
              <span className="sm:hidden" aria-hidden>
                {label.charAt(0)}
              </span>
            </div>
          )
        })}
      </div>
      <div
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
        role="grid"
        aria-label={t('monthCalendar')}
      >
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square rounded-md"
                role="gridcell"
                aria-hidden
              />
            )
          }

          const hasEntry = entriesSet.has(day)
          const isSelected = day === selectedDay
          const today = isToday(day)

          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              onClick={() => selectDay(day)}
              aria-label={t('dayWithEntry', {
                day,
                entryLabel: hasEntry ? resolvedEntryLabel : '',
              })}
              aria-current={isSelected ? 'date' : undefined}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-md border text-sm font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background hover:bg-muted',
                today && !isSelected && ringClass,
              )}
            >
              {day}
              {hasEntry && (
                <span
                  className={cn('absolute bottom-1 h-1 w-1 rounded-full', dotClass)}
                  aria-hidden
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
