'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Select } from '@/components/ui/select'

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export function MonthFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const now = new Date()
  const currentMonth = month ? parseInt(month, 10) : now.getMonth()
  const currentYear = year ? parseInt(year, 10) : now.getFullYear()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const [m, y] = e.target.value.split('-')
    const params = new URLSearchParams(searchParams.toString())
    params.set('month', m)
    params.set('year', y)
    router.push(`${pathname}?${params.toString()}`)
  }

  const value = `${currentMonth}-${currentYear}`
  const options: { value: string; label: string }[] = []
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 11; m >= 0; m--) {
      options.push({ value: `${m}-${y}`, label: `${MONTHS[m]} ${y}` })
      if (y === currentYear - 2 && m === 0) break
    }
  }

  return (
    <Select value={value} onChange={handleChange} className="w-auto min-w-[160px]">
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </Select>
  )
}
