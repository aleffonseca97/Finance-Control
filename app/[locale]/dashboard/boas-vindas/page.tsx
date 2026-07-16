import { auth } from '@/lib/auth'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { prisma } from '@/lib/db'
import { Link } from '@/lib/i18n/navigation'
import {
  Tags,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ExternalLink,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { ContinuarButton } from './continuar-button'
import { getTranslations } from 'next-intl/server'

export default async function BoasVindasPage() {
  const t = await getTranslations('dashboard.onboarding')
  const tOverview = await getTranslations('dashboard.overview')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenWelcome: true },
  })

  if (user?.hasSeenWelcome) await localeRedirect('/dashboard')

  const userName =
    session.user.name?.split(' ')?.[0] || session.user.name || tOverview('defaultUser')

  const sections = [
    {
      title: t('sections.categories.title'),
      icon: Tags,
      description: t('sections.categories.description'),
      href: '/dashboard/configuracoes/categorias',
      linkLabel: t('sections.categories.link'),
    },
    {
      title: t('sections.reservesWallets.title'),
      icon: PiggyBank,
      description: t('sections.reservesWallets.description'),
      href: '/dashboard/configuracoes/investimentos',
      linkLabel: t('sections.reservesWallets.link'),
    },
    {
      title: t('sections.contributions.title'),
      icon: TrendingUp,
      description: t('sections.contributions.description'),
      href: '/dashboard/investimentos',
      linkLabel: t('sections.contributions.link'),
    },
    {
      title: t('sections.creditCard.title'),
      icon: CreditCard,
      description: (
        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
          <li>
            {t('sections.creditCard.bullets.register')}
          </li>
          <li>
            {t('sections.creditCard.bullets.purchases')}
          </li>
          <li>
            {t('sections.creditCard.bullets.invoice')}
          </li>
          <li>
            {t('sections.creditCard.bullets.payment')}
          </li>
          <li>
            {t('sections.creditCard.bullets.alert')}
          </li>
        </ul>
      ),
      href: '/dashboard/cartao-credito',
      linkLabel: t('sections.creditCard.link'),
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <DashboardPageHeader
        leading={<Sparkles className="h-8 w-8 shrink-0 text-primary" aria-hidden />}
        title={t('welcome', { name: userName })}
        description={t('description')}
      />

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="dashboard-bento-card-muted transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typeof section.description === 'string' ? (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                ) : (
                  section.description
                )}
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {section.linkLabel}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="dashboard-bento-card-muted border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{t('feedbackTitle')}</p>
            <p className="text-sm text-muted-foreground">
              {t('feedbackDescription')}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ContinuarButton />
      </div>
    </div>
  )
}
