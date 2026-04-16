import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, absoluteUrl } from '@/lib/stripe'

/**
 * POST /api/billing/checkout
 * Creates (or reuses) a Stripe Customer for the logged-in user,
 * then opens a Checkout Session for a monthly subscription with a 90-day trial.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
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
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // If already active/trialing, redirect to the customer portal instead
  if (
    user.subscription &&
    ['active', 'trialing'].includes(user.subscription.status)
  ) {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId!,
      return_url: absoluteUrl('/dashboard'),
    })
    return NextResponse.json({ url: portalSession.url })
  }

  // Create a Stripe customer if needed
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

  // Create the checkout session with a 90-day (3-month) trial
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: 90,
      metadata: { userId: user.id },
    },
    success_url: absoluteUrl('/dashboard?checkout=success'),
    cancel_url: absoluteUrl('/?checkout=canceled'),
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    locale: 'pt-BR',
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
