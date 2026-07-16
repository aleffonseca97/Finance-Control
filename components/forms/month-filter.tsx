'use client'

import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { Select } from '@/components/ui/select'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { getMonthTitle } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'

export function MonthFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const t = useTranslations('forms.labels')
  const locale = useLocale() as AppLocale
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
    if (searchParams.has('day')) {
      const prev = parseInt(searchParams.get('day') ?? '1', 10)
      const maxDay = new Date(parseInt(y, 10), parseInt(m, 10) + 1, 0).getDate()
      const clamped = Math.min(Math.max(1, prev), maxDay)
      params.set('day', String(clamped))
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const value = `${currentMonth}-${currentYear}`
  const options: { value: string; label: string }[] = []
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let m = 11; m >= 0; m--) {
      options.push({ value: `${m}-${y}`, label: `${getMonthTitle(y, m, locale)} ${y}` })
      if (y === currentYear - 2 && m === 0) break
    }
  }

  return (
    <Select
      value={value}
      onChange={handleChange}
      className="w-auto min-w-[160px]"
      aria-label={t('month')}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </Select>
  )
}
