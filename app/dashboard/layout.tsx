import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { TRIAL_ENDING_BANNER_WITHIN_MS } from '@/lib/billing'
import { Sidebar } from '@/components/dashboard/sidebar'
import { OnboardingRedirect } from '@/components/dashboard/onboarding-redirect'
import { TrialEndingBanner } from '@/components/dashboard/trial-ending-banner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      hasSeenWelcome: true,
      subscription: { select: { status: true, trialEnd: true } },
    },
  })

  const hasSeenWelcome = user?.hasSeenWelcome ?? false

  let trialEndingBannerIso: string | null = null
  const sub = user?.subscription
  if (sub?.status === 'trialing' && sub.trialEnd) {
    const endMs = sub.trialEnd.getTime()
    const msLeft = endMs - Date.now()
    if (msLeft > 0 && msLeft <= TRIAL_ENDING_BANNER_WITHIN_MS) {
      trialEndingBannerIso = sub.trialEnd.toISOString()
    }
  }

  return (
    <div className="min-h-dvh bg-background" data-dashboard-root>
      <OnboardingRedirect hasSeenWelcome={hasSeenWelcome}>
        <Sidebar />
        <main className="dashboard-surface relative z-0 min-h-dvh min-w-0 px-4 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[calc(4.75rem+env(safe-area-inset-top,0px))] sm:px-6 lg:pb-10 lg:pl-[var(--dashboard-sidebar-width)] lg:pr-6 lg:pt-10 transition-[padding] duration-200 ease-out motion-reduce:transition-none">
          <div className="mx-auto w-full min-w-0 max-w-7xl space-y-8">
            {trialEndingBannerIso ? (
              <TrialEndingBanner trialEndIso={trialEndingBannerIso} />
            ) : null}
            {children}
          </div>
        </main>
      </OnboardingRedirect>
    </div>
  )
}
