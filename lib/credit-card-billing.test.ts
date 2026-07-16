import { describe, expect, it } from 'vitest'
import {
  billingCycleForClosingEnd,
  closingDateForMonth,
  endOfDay,
  previousClosingDate,
  startOfDay,
} from '@/lib/credit-card-billing'

describe('startOfDay / endOfDay', () => {
  it('normalizes time bounds', () => {
    const d = new Date(2024, 5, 15, 14, 30, 0)
    expect(startOfDay(d).getHours()).toBe(0)
    expect(startOfDay(d).getMinutes()).toBe(0)
    expect(endOfDay(d).getHours()).toBe(23)
    expect(endOfDay(d).getMinutes()).toBe(59)
  })
})

describe('closing dates', () => {
  it('clamps closing day to last day of short months', () => {
    const feb = closingDateForMonth(2024, 1, 31) // Feb 2024 (leap)
    expect(feb.getDate()).toBe(29)
    expect(feb.getMonth()).toBe(1)
  })

  it('finds previous closing date', () => {
    const end = closingDateForMonth(2024, 5, 10) // Jun 10
    const prev = previousClosingDate(end, 10)
    expect(prev.getFullYear()).toBe(2024)
    expect(prev.getMonth()).toBe(4) // May
    expect(prev.getDate()).toBe(10)
  })
})

describe('billingCycleForClosingEnd', () => {
  it('builds period and due date after closing', () => {
    const closingEnd = closingDateForMonth(2024, 5, 10) // Jun 10
    const cycle = billingCycleForClosingEnd(closingEnd, 10, 17)

    expect(cycle.periodStart.getMonth()).toBe(4) // May 11
    expect(cycle.periodStart.getDate()).toBe(11)
    expect(cycle.periodEnd.getMonth()).toBe(5)
    expect(cycle.periodEnd.getDate()).toBe(10)
    expect(cycle.dueDate.getMonth()).toBe(6) // Jul 17
    expect(cycle.dueDate.getDate()).toBe(17)
  })
})
