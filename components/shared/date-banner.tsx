'use client'

import { useMemo } from 'react'
import { CalendarDays } from 'lucide-react'
import { buildDateValue } from '@/lib/date-utils'
import { cn } from '@/lib/utils'

type Props = {
  year: number
  month: number
  selectedDay: number
  colorClass: string
  iconColorClass: string
}

export function DateBanner({
  year,
  month,
  selectedDay,
  colorClass,
  iconColorClass,
}: Props) {
  const dateValue = buildDateValue(year, month, selectedDay)

  const dateLabelLong = useMemo(
    () =>
      new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [year, month, selectedDay],
  )

  const dateLabelShort = useMemo(
    () =>
      new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [year, month, selectedDay],
  )

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3 py-3 sm:items-center sm:gap-4 sm:px-4 sm:py-3.5',
        colorClass,
      )}
    >
      <CalendarDays
        className={cn(
          'mt-0.5 h-5 w-5 shrink-0 sm:mt-0 sm:h-5 sm:w-5',
          iconColorClass,
        )}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
          Data do lançamento
        </p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
          <time dateTime={dateValue} className="block tabular-nums">
            <span className="sm:hidden">{dateLabelShort}</span>
            <span className="hidden sm:inline">{dateLabelLong}</span>
          </time>
        </p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Altere o dia no calendário ao lado para mudar esta data.
        </p>
      </div>
    </div>
  )
}
