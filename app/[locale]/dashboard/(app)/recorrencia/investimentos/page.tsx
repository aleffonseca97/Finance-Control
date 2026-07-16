import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getReserveCategories, getWalletCategories } from '@/app/actions/categories'
import { getRecurringInvestmentsForMonth } from '@/app/actions/recurring-investments'
import { MonthStepper } from '@/components/forms/month-stepper'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { Card, CardContent } from '@/components/ui/card'
import { parseMonthYearParams } from '@/lib/date-utils'
import { RecurringInvestmentsContent } from './recurring-investments-content'
import { getLocale, getTranslations } from 'next-intl/server'
import { getMonthTitle } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'

export default async function RecorrenciaInvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const t = await getTranslations('dashboard.recurringInvestments')
  const tShared = await getTranslations('dashboard.shared')
  const locale = (await getLocale()) as AppLocale
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const params = await searchParams
  const { month, year } = parseMonthYearParams(params.month, params.year)

  const [reserveCategories, walletCategories, data] = await Promise.all([
    getReserveCategories(),
    getWalletCategories(),
    getRecurringInvestmentsForMonth(month, year),
  ])
  if (!data) await localeRedirect('/login')

  const monthTitle = getMonthTitle(year, month, locale)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />

      <Card className="dashboard-bento-card-hero h-fit lg:sticky lg:top-24">
        <CardContent className="flex flex-col gap-4 py-4 sm:py-5">
          <div>
            <p className="dashboard-section-label text-primary/80">{tShared('editingMonth')}</p>
            <p className="text-lg font-semibold">
              {tShared('monthYear', { month: monthTitle, year })}
            </p>
          </div>
          <div className="w-full min-w-0">
            <MonthStepper />
          </div>
        </CardContent>
      </Card>

      <RecurringInvestmentsContent
        month={month}
        year={year}
        rows={data.rows}
        totalRecurring={data.totalRecurring}
        reserveCategories={reserveCategories}
        walletCategories={walletCategories}
      />
    </div>
  )
}
