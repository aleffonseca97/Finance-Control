'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/select'

const RANGE_BEFORE = 3
const RANGE_AFTER = 6

export function YearFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const now = new Date()
  const currentYear = now.getFullYear()
  const selectedYear = (() => {
    const raw = searchParams.get('year')
    if (!raw) return currentYear
    const n = parseInt(raw, 10)
    return Number.isFinite(n) ? n : currentYear
  })()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('year', e.target.value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const options: number[] = []
  for (let y = currentYear - RANGE_BEFORE; y <= currentYear + RANGE_AFTER; y++) {
    options.push(y)
  }

  return (
    <Select
      value={String(selectedYear)}
      onChange={handleChange}
      className="w-auto min-w-[120px]"
      aria-label="Ano do orçamento"
    >
      {options.map((y) => (
        <option key={y} value={String(y)}>
          {y}
        </option>
      ))}
    </Select>
  )
}
