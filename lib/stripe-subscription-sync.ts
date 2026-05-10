import { prisma } from '@/lib/db'
import { getStripe } from '@/lib/stripe'

/** Stripe subscription fields we persist (explicit shape avoids clashing with Prisma's `Subscription` model). */
export type StripeSubscriptionPayload = {
  id: string
  /** Present on webhook/API objects; used to resolve app user via `stripeCustomerId`. */
  customer?: string | Record<string, unknown>
  items: {
    data: Array<{ price: { id: string }; current_period_end?: number }>
  }
  trial_end: number | null
  /** Present on older API versions; Dahlia exposes period end on `items.data[].current_period_end`. */
  current_period_end?: number | null
  status: string
  cancel_at_period_end: boolean
}

function dateFromUnixSeconds(seconds: number | null | undefined): Date | null {
  if (seconds == null || typeof seconds !== 'number' || !Number.isFinite(seconds)) {
    return null
  }
  const d = new Date(seconds * 1000)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Resolves billing period end for Prisma (`currentPeriodEnd` is required). */
function resolveSubscriptionPeriodEnd(subscription: StripeSubscriptionPayload): Date | null {
  const fromRoot = dateFromUnixSeconds(subscription.current_period_end ?? undefined)
  const fromItems = subscription.items.data
    .map((item) => dateFromUnixSeconds(item.current_period_end))
    .filter((d): d is Date => d != null)
  const maxFromItems =
    fromItems.length > 0 ? new Date(Math.max(...fromItems.map((d) => d.getTime()))) : null
  const fromTrial = dateFromUnixSeconds(subscription.trial_end ?? undefined)
  return fromRoot ?? maxFromItems ?? fromTrial
}

export async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  return user?.id ?? null
}

export async function upsertSubscriptionFromId(subscriptionId: string, userId: string) {
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  await upsertSubscription(subscription as unknown as StripeSubscriptionPayload, userId)
}

export async function upsertSubscription(subscription: StripeSubscriptionPayload, userId: string) {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const trialEnd = dateFromUnixSeconds(subscription.trial_end ?? undefined)
  const currentPeriodEnd = resolveSubscriptionPeriodEnd(subscription)
  if (!currentPeriodEnd) {
    throw new Error(
      `Stripe subscription ${subscription.id} has no current_period_end (root or items) or trial_end; cannot persist`,
    )
  }

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
  const checkoutSession = await getStripe().checkout.sessions.retrieve(checkoutSessionId, {
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
