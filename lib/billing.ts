/**
 * Free trial length for new Stripe subscriptions (Checkout).
 * Stripe bills only after this many days (~2 months at 30-day months).
 */
export const SUBSCRIPTION_TRIAL_PERIOD_DAYS = 60

/** Show the trial-ending banner when remaining time is in (0, window]. */
export const TRIAL_ENDING_BANNER_WITHIN_MS = 5 * 24 * 60 * 60 * 1000
