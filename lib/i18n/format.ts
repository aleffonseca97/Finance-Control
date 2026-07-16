import type { AppLocale } from '@/i18n/routing'
import { defaultCurrency, type AppCurrency } from '@/lib/i18n/currency'

export function formatCurrency(
  value: number,
  locale: AppLocale,
  currency: AppCurrency = defaultCurrency,
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function getCurrencySymbol(locale: AppLocale, currency: AppCurrency) {
  const part = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  })
    .formatToParts(0)
    .find((p) => p.type === 'currency')
  return part?.value ?? currency
}

export function formatNumber(value: number, locale: AppLocale) {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(date: Date | string, locale: AppLocale) {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function getMonthTitle(year: number, month: number, locale: AppLocale) {
  const label = new Date(year, month, 1).toLocaleDateString(locale, {
    month: 'long',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function compareLocale(a: string, b: string, locale: AppLocale) {
  return a.localeCompare(b, locale)
}
