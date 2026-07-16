import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { hasActiveSubscription } from '@/lib/subscription'

/**
 * Paywall only for routes under this group. URLs stay /dashboard/... (route group is invisible).
 * /dashboard/assinatura and /dashboard/boas-vindas are siblings and never hit this layout.
 */
export default async function DashboardSubscribedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  if (!(await hasActiveSubscription(session.user.id))) {
    await localeRedirect('/dashboard/assinatura')
  }

  return <>{children}</>
}
