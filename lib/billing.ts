import type { AppLocale } from '@/i18n/routing'

/**
 * Free trial length for new Stripe subscriptions (Checkout).
 * Stripe bills only after this many days.
 */
export const SUBSCRIPTION_TRIAL_PERIOD_DAYS = 30

/** Show the trial-ending banner when remaining time is in (0, window]. */
export const TRIAL_ENDING_BANNER_WITHIN_MS = 5 * 24 * 60 * 60 * 1000

/**
 * Resolves the Stripe Price ID for a locale:
 * pt-BR → BRL, en → USD, it → EUR (default BRL).
 */
export function getStripePriceIdForLocale(locale: string): string | undefined {
  const normalized = (locale === 'en' || locale === 'it' ? locale : 'pt-BR') as AppLocale

  const byLocale: Record<AppLocale, string | undefined> = {
    'pt-BR': process.env.STRIPE_PRICE_ID_BRL || process.env.STRIPE_PRICE_ID,
    en: process.env.STRIPE_PRICE_ID_USD,
    it: process.env.STRIPE_PRICE_ID_EUR,
  }

  return byLocale[normalized]
}
