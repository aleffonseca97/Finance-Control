'use client'

import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { Select } from '@/components/ui/select'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'

export type TableView = 'daily' | 'monthly' | 'annual'

export function TableViewDropdown() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tShared = useTranslations('dashboard.shared')
  const tForms = useTranslations('forms.labels')
  const view = (searchParams.get('view') as TableView) || 'daily'
  const viewOptions: { value: TableView; label: string }[] = [
    { value: 'daily', label: tShared('viewDaily') },
    { value: 'monthly', label: tShared('viewMonthly') },
    { value: 'annual', label: tShared('viewAnnual') },
  ]

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
      aria-label={tForms('view')}
    >
      {viewOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  )
}
