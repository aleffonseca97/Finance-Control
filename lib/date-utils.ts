export function parseMonthYearParams(
  monthStr?: string,
  yearStr?: string,
  dayStr?: string,
) {
  const now = new Date()
  const month = monthStr !== undefined ? parseInt(monthStr, 10) : now.getMonth()
  const year = yearStr !== undefined ? parseInt(yearStr, 10) : now.getFullYear()
  const dayParam = dayStr !== undefined ? parseInt(dayStr, 10) : undefined
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const defaultDay =
    now.getFullYear() === year && now.getMonth() === month ? now.getDate() : 1
  const selectedDay =
    dayParam !== undefined &&
    !Number.isNaN(dayParam) &&
    dayParam >= 1 &&
    dayParam <= daysInMonth
      ? dayParam
      : defaultDay

  return { month, year, daysInMonth, selectedDay, now }
}

export function getMonthTitle(year: number, month: number) {
  const label = new Date(year, month, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function buildDateValue(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function groupByDay<T extends { date: Date | string }>(
  items: T[],
): Record<number, T[]> {
  const grouped: Record<number, T[]> = {}
  for (const item of items) {
    const d = parseInt(new Date(item.date).toISOString().slice(8, 10), 10)
    if (!grouped[d]) grouped[d] = []
    grouped[d].push(item)
  }
  return grouped
}

export function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
}

export function formatDateBR(date: Date | string) {
  return new Date(date)
    .toISOString()
    .slice(0, 10)
    .split('-')
    .reverse()
    .join('/')
}
