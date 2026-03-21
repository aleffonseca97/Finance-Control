import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Sidebar } from '@/components/dashboard/sidebar'
import { OnboardingRedirect } from '@/components/dashboard/onboarding-redirect'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenWelcome: true },
  })
  const hasSeenWelcome = user?.hasSeenWelcome ?? false

  return (
    <div className="min-h-screen bg-background">
      <OnboardingRedirect hasSeenWelcome={hasSeenWelcome}>
        <Sidebar />
        <main className="lg:pl-64 pt-16 lg:pt-0 min-h-screen p-6">
          {children}
        </main>
      </OnboardingRedirect>
    </div>
  )
}
