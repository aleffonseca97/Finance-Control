'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type Props = {
  year: number
  month: number
  daysInMonth: number
  selectedDay: number
  daysWithEntries: number[]
  todayYear: number
  todayMonth: number
  todayDay: number
}

export function EntradasCalendar({
  year,
  month,
  daysInMonth,
  selectedDay,
  daysWithEntries,
  todayYear,
  todayMonth,
  todayDay,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
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

  return (
    <div className="w-full space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Selecione o dia
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase text-muted-foreground sm:gap-1.5 sm:text-xs">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            <span className="sr-only sm:not-sr-only">{w}</span>
            <span className="sm:hidden" aria-hidden>
              {w.charAt(0)}
            </span>
          </div>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1 sm:gap-1.5"
        role="grid"
        aria-label="Calendário do mês"
      >
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square min-h-[2.5rem] sm:min-h-[2.75rem]"
                aria-hidden
              />
            )
          }
          const hasEntry = entriesSet.has(day)
          const selected = day === selectedDay
          const today = isToday(day)

          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-pressed={selected}
              aria-current={today ? 'date' : undefined}
              aria-label={`Dia ${day}${hasEntry ? ', com lançamento' : ''}`}
              onClick={() => selectDay(day)}
              className={cn(
                'relative flex aspect-square min-h-[2.5rem] w-full flex-col items-center justify-center rounded-lg border text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected &&
                  'border-primary bg-primary text-primary-foreground shadow-sm',
                !selected &&
                  today &&
                  'border-primary/50 bg-primary/10 text-foreground hover:bg-primary/15',
                !selected &&
                  !today &&
                  'border-transparent bg-muted/50 text-foreground hover:bg-muted',
                hasEntry &&
                  !selected &&
                  'ring-1 ring-emerald-500/45 dark:ring-emerald-400/40',
              )}
            >
              <span className="tabular-nums">{day}</span>
              {hasEntry && (
                <span
                  className={cn(
                    'absolute bottom-1 h-1.5 w-1.5 rounded-full',
                    selected ? 'bg-primary-foreground' : 'bg-emerald-500',
                  )}
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
