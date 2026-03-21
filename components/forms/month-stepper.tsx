'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MONTHS } from '@/lib/constants'

function addCalendarMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1)
  return { year: d.getFullYear(), month: d.getMonth() }
}

type MonthStepperProps = {
  className?: string
  showLabel?: boolean
}

export function MonthStepper({ className, showLabel = false }: MonthStepperProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const now = new Date()
  const currentMonth = month ? parseInt(month, 10) : now.getMonth()
  const currentYear = year ? parseInt(year, 10) : now.getFullYear()

  function navigate(delta: number) {
    const { year: y, month: m } = addCalendarMonth(
      currentYear,
      currentMonth,
      delta
    )
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', String(m))
    params.set('year', String(y))
    if (searchParams.has('day')) {
      const prev = parseInt(searchParams.get('day') ?? '1', 10)
      const maxDay = new Date(y, m + 1, 0).getDate()
      const clamped = Math.min(Math.max(1, prev), maxDay)
      params.set('day', String(clamped))
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const monthLabel = `${MONTHS[currentMonth]} ${currentYear}`

  return (
    <div
      className={cn('flex w-full items-stretch gap-2', className)}
    >
      <Button
        type="button"
        variant="outline"
        className="flex-1 gap-1.5"
        aria-label="Mês anterior"
        onClick={() => navigate(-1)}
      >
        <ChevronLeft className="h-4 w-4 shrink-0" />
        Anterior
      </Button>
      {showLabel && (
        <span className="flex min-w-[120px] items-center justify-center px-3 text-sm font-medium">
          {monthLabel}
        </span>
      )}
      <Button
        type="button"
        variant="outline"
        className="flex-1 gap-1.5"
        aria-label="Próximo mês"
        onClick={() => navigate(1)}
      >
        Próximo
        <ChevronRight className="h-4 w-4 shrink-0" />
      </Button>
    </div>
  )
}
