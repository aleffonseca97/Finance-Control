import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { stripe, absoluteUrl } from '@/lib/stripe'

/**
 * POST /api/billing/portal
 * Opens the Stripe Customer Portal so users can manage their subscription,
 * update payment method, or cancel.
 */
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'Nenhuma assinatura encontrada para este usuário' },
      { status: 404 }
    )
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: absoluteUrl('/dashboard/configuracoes'),
  })

  return NextResponse.json({ url: portalSession.url })
}
