/** Y/M in calendar month (1–12), UTC-aligned with @db.Date fields. */
export function dateToYearMonthUTC(d: Date): { y: number; m: number } {
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1 }
}

export function addMonthsYM(y: number, m: number, delta: number): { y: number; m: number } {
  const idx = y * 12 + (m - 1) + delta
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
}

/** Calendar month when installment #k (1-based) is due. */
export function installmentDueYearMonth(firstInstallmentDate: Date, k: number): { y: number; m: number } {
  const start = dateToYearMonthUTC(firstInstallmentDate)
  return addMonthsYM(start.y, start.m, k - 1)
}

/** Unpaid installments (k > paidInstallments) with due date in calendarYear. */
export function countRemainingDueInYear(
  firstInstallmentDate: Date,
  totalInstallments: number,
  paidInstallments: number,
  calendarYear: number,
): number {
  let n = 0
  for (let k = paidInstallments + 1; k <= totalInstallments; k++) {
    const { y } = installmentDueYearMonth(firstInstallmentDate, k)
    if (y === calendarYear) n++
  }
  return n
}

export function remainingAmountInYear(
  monthlyAmount: number,
  firstInstallmentDate: Date,
  totalInstallments: number,
  paidInstallments: number,
  calendarYear: number,
): number {
  return monthlyAmount * countRemainingDueInYear(
    firstInstallmentDate,
    totalInstallments,
    paidInstallments,
    calendarYear,
  )
}

/** Sum of monthlyAmount for each month 1–12 (only unpaid installments in that year). */
export function monthlyTotalsRemainingInYear(
  plans: Array<{
    monthlyAmount: number
    firstInstallmentDate: Date
    totalInstallments: number
    paidInstallments: number
  }>,
  calendarYear: number,
): number[] {
  const totals = Array.from({ length: 12 }, () => 0)
  for (const p of plans) {
    for (let k = p.paidInstallments + 1; k <= p.totalInstallments; k++) {
      const { y, m } = installmentDueYearMonth(p.firstInstallmentDate, k)
      if (y === calendarYear) totals[m - 1] += p.monthlyAmount
    }
  }
  return totals
}
