import { NextResponse } from 'next/server'
import { getLocale, getTranslations } from 'next-intl/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { SUBSCRIPTION_TRIAL_PERIOD_DAYS } from '@/lib/billing'
import { stripe, absoluteUrl } from '@/lib/stripe'
import { getUserLocale } from '@/app/actions/locale'
import type { AppLocale } from '@/i18n/routing'

function toStripeLocale(locale: string): 'pt-BR' | 'en' | 'it' {
  if (locale === 'en' || locale === 'it') return locale
  return 'pt-BR'
}

/**
 * POST /api/billing/checkout
 * Creates (or reuses) a Stripe Customer for the logged-in user,
 * then opens a Checkout Session for a monthly subscription with a free trial
 * (SUBSCRIPTION_TRIAL_PERIOD_DAYS — first charge only after the trial ends).
 */
export async function POST() {
  const session = await auth()
  const t = await getTranslations('errors')
  if (!session?.user?.id) {
    return NextResponse.json({ error: t('unauthorized') }, { status: 401 })
  }

  const priceId = process.env.STRIPE_PRICE_ID
  if (!priceId) {
    return NextResponse.json({ error: 'STRIPE_PRICE_ID não configurado' }, { status: 500 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, stripeCustomerId: true, subscription: true },
  })

  if (!user) {
    return NextResponse.json({ error: t('server.userNotFound') }, { status: 404 })
  }

  const locale = await getUserLocale(session.user.id)
  const requestLocale = (await getLocale()) as AppLocale
  const activeLocale = locale || requestLocale

  if (
    user.subscription &&
    ['active', 'trialing'].includes(user.subscription.status)
  ) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId!,
      return_url: absoluteUrl(`/${activeLocale}/dashboard`),
    })
    return NextResponse.json({ url: portalSession.url })
  }

  let customerId = user.stripeCustomerId
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id
    await prisma.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: customerId },
    })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: SUBSCRIPTION_TRIAL_PERIOD_DAYS,
      metadata: { userId: user.id },
    },
    success_url: absoluteUrl(
      `/${activeLocale}/dashboard/assinatura?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    ),
    cancel_url: absoluteUrl(`/${activeLocale}/?checkout=canceled`),
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: toStripeLocale(activeLocale),
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
