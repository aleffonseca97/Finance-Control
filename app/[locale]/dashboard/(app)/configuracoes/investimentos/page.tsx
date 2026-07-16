import { auth } from '@/lib/auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { compareLocale } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'
import { getCategoriesByType, getUserCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function InvestimentosConfigPage() {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const t = await getTranslations('settings.investmentCategories')
  const locale = (await getLocale()) as AppLocale

  const [investmentCategories, allInvestmentCategories] = await Promise.all([
    getUserCategoriesByType('investment'),
    getCategoriesByType('investment'),
  ])
  const reserveCategories = investmentCategories.filter(
    (cat) => cat.investmentSubtype === 'reserva'
  )
  const walletCategories = investmentCategories.filter(
    (cat) => cat.investmentSubtype === 'carteira'
  )
  const reserveGroups = Array.from(
    new Set(
      allInvestmentCategories
        .filter((category) => category.investmentSubtype === 'reserva')
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => compareLocale(a, b, locale))
  const walletGroups = Array.from(
    new Set(
      allInvestmentCategories
        .filter((category) => category.investmentSubtype === 'carteira')
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => compareLocale(a, b, locale))

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="space-y-6">
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{t('reserves')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('reservesHint')}
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={reserveCategories}
              availableGroups={reserveGroups}
              type="investment"
              isFixed={false}
              title=""
              investmentSubtype="reserva"
            />
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{t('wallets')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t('walletsHint')}
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={walletCategories}
              availableGroups={walletGroups}
              type="investment"
              isFixed={false}
              title=""
              investmentSubtype="carteira"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
