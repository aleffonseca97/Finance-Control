import { describe, expect, it } from 'vitest'
import { roundMoney } from '@/lib/credit-card-billing'

describe('roundMoney', () => {
  it('rounds to two decimal places', () => {
    expect(roundMoney(10.456)).toBe(10.46)
    expect(roundMoney(10.454)).toBe(10.45)
    expect(roundMoney(10.125)).toBe(10.13)
  })
})
