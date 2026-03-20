'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/select'

export type TableView = 'daily' | 'monthly' | 'annual'

const VIEW_OPTIONS: { value: TableView; label: string }[] = [
  { value: 'daily', label: 'Diária' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'annual', label: 'Anual' },
]

export function TableViewDropdown() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const view = (searchParams.get('view') as TableView) || 'daily'

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newView = e.target.value as TableView
    const params = new URLSearchParams(searchParams.toString())
    params.set('view', newView)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Select
      value={view}
      onChange={handleChange}
      className="w-auto min-w-[140px]"
    >
      {VIEW_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
