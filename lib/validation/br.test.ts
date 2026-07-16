import { describe, expect, it } from 'vitest'
import {
  buildE164,
  digitsOnly,
  formatCpfDisplay,
  isValidCpf,
  isValidPhoneNational,
} from '@/lib/validation/br'

describe('digitsOnly', () => {
  it('strips non-digits', () => {
    expect(digitsOnly('a1b2c3')).toBe('123')
    expect(digitsOnly('529.982.247-25')).toBe('52998224725')
  })
})

describe('isValidCpf', () => {
  it('accepts a valid CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true)
    expect(isValidCpf('52998224725')).toBe(true)
  })

  it('rejects wrong length, repeated digits, and bad check digits', () => {
    expect(isValidCpf('123')).toBe(false)
    expect(isValidCpf('11111111111')).toBe(false)
    expect(isValidCpf('52998224724')).toBe(false)
  })
})

describe('formatCpfDisplay', () => {
  it('applies progressive mask', () => {
    expect(formatCpfDisplay('529')).toBe('529')
    expect(formatCpfDisplay('529982')).toBe('529.982')
    expect(formatCpfDisplay('529982247')).toBe('529.982.247')
    expect(formatCpfDisplay('52998224725')).toBe('529.982.247-25')
  })
})

describe('phone helpers', () => {
  it('builds E.164', () => {
    expect(buildE164('55', '(11) 98888-7777')).toBe('+5511988887777')
    expect(buildE164('', '11988887777')).toBe('')
  })

  it('validates BR and international national numbers', () => {
    expect(isValidPhoneNational('55', '11988887777')).toBe(true)
    expect(isValidPhoneNational('55', '1133334444')).toBe(true)
    expect(isValidPhoneNational('55', '11888887777')).toBe(false) // mobile must start with 9
    expect(isValidPhoneNational('55', '1088888777')).toBe(false) // invalid DDD
    expect(isValidPhoneNational('1', '2025550123')).toBe(true)
    expect(isValidPhoneNational('1', '123')).toBe(false)
  })
})
