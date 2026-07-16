import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getCreditCardPagePayload } from '@/app/actions/credit-cards'
import { ensureGlobalCategories } from '@/app/actions/categories'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { CreditCardMainCategoriesPieChart } from '@/components/charts/credit-card-main-categories-pie-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { getTranslations } from 'next-intl/server'

export default async function CartaoCreditoPage() {
  const t = await getTranslations('dashboard.creditCard')
  const tShared = await getTranslations('dashboard.shared')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  await ensureGlobalCategories()

  const payload = await getCreditCardPagePayload()
  if (!payload) await localeRedirect('/login')

  const { cards, availableCash, overdueNotices, creditCardCategorySpending } = payload

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="space-y-6">
        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('cardsAndPayments')}</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tShared('cardsClosingHint')}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardList
              cards={cards}
              availableCash={availableCash}
              overdueNotices={overdueNotices}
            />
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('spendingByCategory')}</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tShared('creditCardCategoriesHint')}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardMainCategoriesPieChart data={creditCardCategorySpending} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
