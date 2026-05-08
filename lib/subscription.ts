import { prisma } from '@/lib/db'

/** Statuses that grant full access to the application. */
const ACTIVE_STATUSES = new Set(['trialing', 'active'])

/**
 * Returns true if the user has an active or trialing Stripe subscription.
 * Users with no subscription record (e.g., registered before billing was added)
 * are considered inactive until they complete checkout.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { status: true },
  })
  return sub ? ACTIVE_STATUSES.has(sub.status) : false
}

/**
 * Returns the subscription record for a user, or null if none exists.
 */
export async function getSubscription(userId: string) {
  return prisma.subscription.findUnique({
    where: { userId },
    select: {
      status: true,
      currentPeriodEnd: true,
      trialEnd: true,
      cancelAtPeriodEnd: true,
    },
  })
}
