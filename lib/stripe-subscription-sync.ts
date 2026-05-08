import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

/** Stripe subscription fields we persist (explicit shape avoids clashing with Prisma's `Subscription` model). */
export type StripeSubscriptionPayload = {
  id: string
  /** Present on webhook/API objects; used to resolve app user via `stripeCustomerId`. */
  customer?: string | Record<string, unknown>
  items: { data: Array<{ price: { id: string } }> }
  trial_end: number | null
  current_period_end: number
  status: string
  cancel_at_period_end: boolean
}

export async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function upsertSubscriptionFromId(subscriptionId: string, userId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await upsertSubscription(subscription as unknown as StripeSubscriptionPayload, userId)
}

export async function upsertSubscription(subscription: StripeSubscriptionPayload, userId: string) {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000)

  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: subscription.id },
    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
    update: {
      stripePriceId: priceId,
      status: subscription.status,
      currentPeriodEnd,
      trialEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  })
}

/**
 * Fallback when webhooks are unavailable (e.g. localhost without Stripe CLI, or missing STRIPE_WEBHOOK_SECRET).
 * Loads the Checkout Session from Stripe and upserts Subscription after verifying metadata.userId.
 */
export async function syncSubscriptionFromCheckoutSession(
  checkoutSessionId: string,
  userId: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId, {
    expand: ['subscription'],
  })

  if (checkoutSession.mode !== 'subscription') {
    return { ok: false, reason: 'not_subscription' }
  }

  if (checkoutSession.metadata?.userId !== userId) {
    return { ok: false, reason: 'user_mismatch' }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  })
  const sessionCustomerId =
    typeof checkoutSession.customer === 'string'
      ? checkoutSession.customer
      : checkoutSession.customer?.id
  if (
    user?.stripeCustomerId &&
    sessionCustomerId &&
    sessionCustomerId !== user.stripeCustomerId
  ) {
    return { ok: false, reason: 'customer_mismatch' }
  }

  const subRef = checkoutSession.subscription
  let subscriptionId: string | null = null
  if (typeof subRef === 'string') {
    subscriptionId = subRef
  } else if (subRef && typeof subRef === 'object' && 'id' in subRef) {
    subscriptionId = (subRef as unknown as StripeSubscriptionPayload).id
  }

  if (!subscriptionId) {
    return { ok: false, reason: 'no_subscription' }
  }

  await upsertSubscriptionFromId(subscriptionId, userId)
  return { ok: true }
}
