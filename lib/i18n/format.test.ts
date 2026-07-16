import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatNumber,
  getCurrencySymbol,
  getMonthTitle,
} from '@/lib/i18n/format'

describe('formatCurrency', () => {
  it('formats BRL for pt-BR', () => {
    const result = formatCurrency(1234.5, 'pt-BR', 'BRL')
    expect(result).toMatch(/1\.234,50/)
    expect(result).toMatch(/R\$/)
  })

  it('formats USD for en', () => {
    const result = formatCurrency(10, 'en', 'USD')
    expect(result).toMatch(/10\.00/)
    expect(result).toContain('$')
  })
})

describe('formatNumber', () => {
  it('uses locale decimal separators', () => {
    expect(formatNumber(12.5, 'pt-BR')).toBe('12,50')
    expect(formatNumber(12.5, 'en')).toBe('12.50')
  })
})

describe('formatDate / getMonthTitle', () => {
  it('formats a fixed date', () => {
    const date = new Date('2024-06-15T12:00:00.000Z')
    expect(formatDate(date, 'pt-BR')).toMatch(/15/)
    expect(formatDate(date, 'pt-BR')).toMatch(/06|6/)
    expect(formatDate(date, 'pt-BR')).toMatch(/2024/)
  })

  it('returns capitalized month title', () => {
    const title = getMonthTitle(2024, 0, 'pt-BR')
    expect(title.charAt(0)).toBe(title.charAt(0).toUpperCase())
    expect(title.toLowerCase()).toContain('janeiro')
  })
})

describe('getCurrencySymbol', () => {
  it('returns a currency symbol for the locale', () => {
    expect(getCurrencySymbol('pt-BR', 'BRL')).toMatch(/R\$|BRL/)
  })
})
