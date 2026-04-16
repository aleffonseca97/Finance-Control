import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/db'

/**
 * POST /api/webhooks/stripe
 * Validates Stripe webhook signatures and syncs subscription state to the database.
 *
 * Required env var: STRIPE_WEBHOOK_SECRET
 *
 * Events handled:
 *   - checkout.session.completed
 *   - customer.subscription.created
 *   - customer.subscription.updated
 *   - customer.subscription.deleted
 *   - invoice.payment_succeeded
 *   - invoice.payment_failed
 */
export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const subscriptionId = session.subscription as string
        const userId = session.metadata?.userId

        if (!userId || !subscriptionId) break

        await upsertSubscriptionFromId(subscriptionId, userId)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = await userIdFromCustomer(subscription.customer as string)
        if (!userId) break
        await upsertSubscription(subscription, userId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: 'canceled', cancelAtPeriodEnd: false },
        })
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break
        const sub = await stripe.subscriptions.retrieve(subscriptionId)
        const userId = await userIdFromCustomer(sub.customer as string)
        if (userId) await upsertSubscription(sub, userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string }
        const subscriptionId = invoice.subscription
        if (!subscriptionId) break
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'past_due' },
        })
        break
      }

      default:
        // Unhandled event — return 200 to acknowledge receipt
        break
    }
  } catch (err) {
    console.error(`Error processing webhook event ${event.type}:`, err)
    return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ─── Helpers ───────────────────────────────────────────────────────────────

async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  })
  return user?.id ?? null
}

async function upsertSubscriptionFromId(subscriptionId: string, userId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  await upsertSubscription(subscription, userId)
}

async function upsertSubscription(subscription: Stripe.Subscription, userId: string) {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null
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
