import { auth } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { Link } from '@/lib/i18n/navigation'
import { User, Tags, PiggyBank } from 'lucide-react'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const t = await getTranslations('settings')
  const tNav = await getTranslations('nav')

  const links = [
    { href: '/dashboard/configuracoes/perfil', label: tNav('profile'), description: t('profile.description'), icon: User },
    { href: '/dashboard/configuracoes/categorias', label: tNav('categories'), description: t('categories.description'), icon: Tags },
    { href: '/dashboard/configuracoes/investimentos', label: tNav('investmentCategories'), description: t('investmentCategories.description'), icon: PiggyBank },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('index.title')}
        description={t('index.description')}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="dashboard-bento-card-muted h-full transition-all hover:border-primary/25 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
