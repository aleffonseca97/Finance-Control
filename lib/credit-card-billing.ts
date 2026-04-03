/** Ciclo de fatura: compras entre o dia seguinte ao fechamento anterior e o dia do fechamento (inclusive). */

export type BillingCycle = {
  periodStart: Date
  periodEnd: Date
  dueDate: Date
}

function clampDayInMonth(year: number, month: number, day: number): Date {
  const last = new Date(year, month + 1, 0).getDate()
  const d = Math.min(day, last)
  return new Date(year, month, d, 12, 0, 0, 0)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function closingDateForMonth(
  year: number,
  month: number,
  closingDay: number,
): Date {
  return clampDayInMonth(year, month, closingDay)
}

export function previousClosingDate(closingEnd: Date, closingDay: number): Date {
  const y = closingEnd.getFullYear()
  const m = closingEnd.getMonth() - 1
  return closingDateForMonth(y, m, closingDay)
}

export function billingCycleForClosingEnd(
  closingEnd: Date,
  closingDay: number,
  dueDay: number,
): BillingCycle {
  const prev = previousClosingDate(closingEnd, closingDay)
  const periodStart = startOfDay(addDays(prev, 1))
  const periodEnd = endOfDay(closingEnd)
  const y = closingEnd.getFullYear()
  const m = closingEnd.getMonth()
  const dueDate = endOfDay(clampDayInMonth(y, m + 1, dueDay))
  return { periodStart, periodEnd, dueDate }
}

export function dateOnlyInRange(t: Date, start: Date, end: Date): boolean {
  const t0 = startOfDay(t).getTime()
  return t0 >= startOfDay(start).getTime() && t0 <= startOfDay(end).getTime()
}

/** Após o dia do vencimento (notificação de atraso). */
export function isDueDatePassed(dueDate: Date, today: Date): boolean {
  return startOfDay(today).getTime() > startOfDay(dueDate).getTime()
}

export function normalizePeriodEndKey(periodEnd: Date): Date {
  return startOfDay(periodEnd)
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

export type CycleInvoice = BillingCycle & {
  closingEnd: Date
  invoice: number
}

/** Fechamentos com data ≤ ref (mesmo dia conta), até `maxCycles` ciclos. */
export function listClosingEndsOnOrBefore(
  ref: Date,
  closingDay: number,
  maxCycles: number,
): Date[] {
  const out: Date[] = []
  let y = ref.getFullYear()
  let m = ref.getMonth()
  let guard = 0
  while (out.length < maxCycles && guard < 240) {
    guard += 1
    const closing = closingDateForMonth(y, m, closingDay)
    if (startOfDay(closing).getTime() <= startOfDay(ref).getTime()) {
      out.push(closing)
    }
    m -= 1
    if (m < 0) {
      m = 11
      y -= 1
    }
  }
  return out
}

/**
 * Aloca pagamentos (FIFO por data) às faturas em ordem de vencimento.
 * Retorna valor alocado por ciclo (chave = periodEnd.getTime()).
 */
export function allocatePaymentsFifo(
  cycles: { periodEnd: Date; invoice: number }[],
  payments: { date: Date; amount: number }[],
): Map<number, number> {
  const sortedCycles = [...cycles].sort(
    (a, b) => startOfDay(a.periodEnd).getTime() - startOfDay(b.periodEnd).getTime(),
  )
  const sortedPay = [...payments].sort(
    (a, b) => startOfDay(a.date).getTime() - startOfDay(b.date).getTime(),
  )
  let pi = 0
  let pRem = 0
  const paid = new Map<number, number>()
  const eps = 1e-6

  for (const c of sortedCycles) {
    const key = startOfDay(c.periodEnd).getTime()
    let owed = c.invoice
    let alloc = 0
    while (owed > eps && (pi < sortedPay.length || pRem > eps)) {
      if (pRem <= eps && pi < sortedPay.length) {
        pRem = sortedPay[pi].amount
        pi++
      }
      const chunk = Math.min(owed, pRem)
      owed -= chunk
      pRem -= chunk
      alloc += chunk
    }
    paid.set(key, roundMoney(alloc))
  }
  return paid
}
