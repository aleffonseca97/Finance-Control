import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getCategoriesByType } from '@/app/actions/categories'
import { getRecurringPaymentsForMonth } from '@/app/actions/recurring-payments'
import { MonthStepper } from '@/components/forms/month-stepper'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { Card, CardContent } from '@/components/ui/card'
import { parseMonthYearParams } from '@/lib/date-utils'
import { RecurringPaymentsContent } from './recurring-payments-content'
import { getLocale, getTranslations } from 'next-intl/server'
import { getMonthTitle } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'

export default async function PagamentosRecorrentesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const t = await getTranslations('dashboard.recurringPayments')
  const tShared = await getTranslations('dashboard.shared')
  const locale = (await getLocale()) as AppLocale
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const params = await searchParams
  const { month, year } = parseMonthYearParams(params.month, params.year)

  const [categories, data] = await Promise.all([
    getCategoriesByType('expense'),
    getRecurringPaymentsForMonth(month, year),
  ])

  if (!data) await localeRedirect('/login')

  const monthTitle = getMonthTitle(year, month, locale)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="top-[calc(4.75rem+env(safe-area-inset-top,0px))] z-20 lg:top-6">
        <Card className="dashboard-bento-card-hero border-border/80 bg-card/95 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-card/90">
          <CardContent className="flex flex-col gap-4 py-4 sm:py-5">
            <div>
              <p className="dashboard-section-label text-primary/80">
                {tShared('editingMonth')}
              </p>
              <p className="text-lg font-semibold">
                {tShared('monthYear', { month: monthTitle, year })}
              </p>
            </div>
            <div className="w-full min-w-0">
              <MonthStepper />
            </div>
          </CardContent>
        </Card>
      </div>

      <RecurringPaymentsContent
        month={month}
        year={year}
        rows={data.rows}
        totalRecurring={data.totalRecurring}
        totalIncome={data.totalIncome}
        health={data.health}
        categories={categories}
      />
    </div>
  )
}
