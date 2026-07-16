import { auth } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { prisma } from '@/lib/db'
import { ProfileForm } from '@/components/settings/profile-form'
import { SubscriptionSection } from '@/components/settings/subscription-section'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { CurrencySwitcher } from '@/components/currency-switcher'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const t = await getTranslations('settings')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      marketingOptIn: true,
      stripeCustomerId: true,
      subscription: {
        select: {
          status: true,
          currentPeriodEnd: true,
          trialEnd: true,
          cancelAtPeriodEnd: true,
        },
      },
    },
  })

  if (!user) await localeRedirect('/login')

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('profile.title')}
        description={t('profile.description')}
      />

      <div className="dashboard-bento-card-muted flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">{t('appearance.title')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('appearance.description')}
          </p>
        </div>
        <div className="flex justify-end sm:shrink-0">
          <ThemeToggle />
        </div>
      </div>

      <div className="dashboard-bento-card-muted p-4">
        <LocaleSwitcher variant="full" />
      </div>

      <div className="dashboard-bento-card-muted p-4">
        <CurrencySwitcher />
      </div>

      <ProfileForm
        name={user.name}
        email={user.email}
        marketingOptIn={user.marketingOptIn}
      />

      <SubscriptionSection
        stripeCustomerId={user.stripeCustomerId}
        subscription={user.subscription}
      />
    </div>
  )
}
