import Stripe from 'stripe'

let stripeClient: Stripe | null = null

/** Lazy init so `next build` does not require Stripe env vars (Docker/CI). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
    })
  }
  return stripeClient
}

/** Returns the absolute URL for Stripe success/cancel redirects. */
export function absoluteUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  return `${base}${path}`
}
