'use client'

import { useSearchParams } from 'next/navigation'
import { TableViewDropdown } from '@/components/forms/table-view-dropdown'
import { MonthStepper } from '@/components/forms/month-stepper'
import type { TableView } from '@/components/forms/table-view-dropdown'

export function TabelaAnualFilters() {
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as TableView) || 'daily'
  const showMonthStepper = view === 'daily' || view === 'monthly'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <TableViewDropdown />
      {showMonthStepper && <MonthStepper showLabel className="sm:w-auto sm:min-w-[280px]" />}
    </div>
  )
}
