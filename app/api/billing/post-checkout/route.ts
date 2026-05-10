import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { absoluteUrl } from '@/lib/stripe'
import { syncSubscriptionFromCheckoutSession } from '@/lib/stripe-subscription-sync'

/**
 * GET /api/billing/post-checkout?session_id=...
 * Stripe success_url lands here so we sync subscription and revalidate outside RSC render.
 */
export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('session_id')
  const session = await auth()

  if (!session?.user?.id || !sessionId) {
    return NextResponse.redirect(absoluteUrl('/dashboard/assinatura?checkout=invalid'))
  }

  const result = await syncSubscriptionFromCheckoutSession(sessionId, session.user.id)
  revalidatePath('/dashboard')

  if (result.ok) {
    return NextResponse.redirect(absoluteUrl('/dashboard'))
  }

  return NextResponse.redirect(absoluteUrl('/dashboard/assinatura?checkout=sync_failed'))
}
