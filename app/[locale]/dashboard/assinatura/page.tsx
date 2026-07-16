import { Suspense } from 'react'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { syncSubscriptionFromCheckoutSession } from '@/lib/stripe-subscription-sync'
import { AssinaturaClient } from './assinatura-client'

type SearchParams = {
  checkout?: string | string[]
  session_id?: string | string[]
}

export default async function AssinaturaPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const checkout =
    typeof params.checkout === 'string' ? params.checkout : params.checkout?.[0]
  const sessionId =
    typeof params.session_id === 'string' ? params.session_id : params.session_id?.[0]

  const session = await auth()
  if (checkout === 'success' && sessionId && session?.user?.id) {
    const result = await syncSubscriptionFromCheckoutSession(sessionId, session.user.id)
    revalidatePath('/dashboard')
    if (result.ok) {
      await localeRedirect('/dashboard')
    }
    await localeRedirect('/dashboard/assinatura?checkout=sync_failed')
  }

  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AssinaturaClient />
    </Suspense>
  )
}
