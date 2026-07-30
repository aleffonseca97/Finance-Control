import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getCreditCardPagePayload } from '@/app/actions/credit-cards'
import { ensureGlobalCategories } from '@/app/actions/categories'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { CreditCardInstallments } from '@/components/credit-card/credit-card-installments'
import { CreditCardMainCategoriesPieChart } from '@/components/charts/credit-card-main-categories-pie-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { getTranslations, getLocale } from 'next-intl/server'
import { formatCurrency } from '@/lib/i18n/format'
import { getCurrentCurrency } from '@/lib/i18n/get-currency'
import type { AppLocale } from '@/i18n/routing'

export default async function CartaoCreditoPage() {
  const t = await getTranslations('dashboard.creditCard')
  const tShared = await getTranslations('dashboard.shared')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  await ensureGlobalCategories()

  const payload = await getCreditCardPagePayload()
  if (!payload) await localeRedirect('/login')

  const locale = (await getLocale()) as AppLocale
  const currency = await getCurrentCurrency()

  const {
    cards,
    installmentPlans,
    creditCardCategorySpending,
    monthSpentTotal,
    totalLimitSum,
    activeMonthlyCommitment,
    totalRemainingInYear,
    year,
  } = payload

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t('title')} description={t('description')} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="dashboard-bento-card shadow-md">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('summaryMonthSpend')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(monthSpentTotal, locale, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('summaryOfLimit', {
                amount: formatCurrency(totalLimitSum, locale, currency),
              })}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card shadow-md">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('summaryMonthlyCommitment')}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(activeMonthlyCommitment, locale, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('summaryActiveInstallments')}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card shadow-md">
          <CardHeader className="pb-2 pt-4 px-4 sm:px-6">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('summaryRemainingYear', { year })}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6">
            <p className="text-2xl font-bold tabular-nums">
              {formatCurrency(totalRemainingInYear, locale, currency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('summaryRemainingYearHint')}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('cardsSection')}</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {tShared('cardsClosingHint')}
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardList cards={cards} />
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">{t('installmentsSection')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardInstallments cards={cards} plans={installmentPlans} />
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
