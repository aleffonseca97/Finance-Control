import { describe, expect, it } from 'vitest'
import {
  addMonthsYM,
  countRemainingDueInYear,
  dateToYearMonthUTC,
  installmentDueYearMonth,
  monthlyTotalsRemainingInYear,
  remainingAmountInYear,
} from '@/lib/installment-schedule'

describe('dateToYearMonthUTC', () => {
  it('reads UTC year/month', () => {
    expect(dateToYearMonthUTC(new Date('2024-03-15T00:00:00.000Z'))).toEqual({
      y: 2024,
      m: 3,
    })
  })
})

describe('addMonthsYM', () => {
  it('adds months across year boundaries', () => {
    expect(addMonthsYM(2024, 11, 2)).toEqual({ y: 2025, m: 1 })
    expect(addMonthsYM(2024, 1, -1)).toEqual({ y: 2023, m: 12 })
  })
})

describe('installmentDueYearMonth', () => {
  it('returns due month for installment k (1-based)', () => {
    const first = new Date('2024-01-10T00:00:00.000Z')
    expect(installmentDueYearMonth(first, 1)).toEqual({ y: 2024, m: 1 })
    expect(installmentDueYearMonth(first, 3)).toEqual({ y: 2024, m: 3 })
  })
})

describe('remaining installments in year', () => {
  const first = new Date('2024-10-01T00:00:00.000Z')

  it('counts unpaid dues in the calendar year', () => {
    // Oct, Nov, Dec 2024 unpaid when paidInstallments = 0, total = 6
    expect(countRemainingDueInYear(first, 6, 0, 2024)).toBe(3)
    expect(countRemainingDueInYear(first, 6, 2, 2024)).toBe(1) // only Dec left in 2024
  })

  it('computes remaining amount', () => {
    expect(remainingAmountInYear(100, first, 6, 0, 2024)).toBe(300)
  })

  it('aggregates monthly totals', () => {
    const totals = monthlyTotalsRemainingInYear(
      [
        {
          monthlyAmount: 50,
          firstInstallmentDate: first,
          totalInstallments: 3,
          paidInstallments: 0,
        },
      ],
      2024,
    )
    expect(totals[9]).toBe(50) // Oct
    expect(totals[10]).toBe(50) // Nov
    expect(totals[11]).toBe(50) // Dec
    expect(totals[0]).toBe(0)
  })
})
