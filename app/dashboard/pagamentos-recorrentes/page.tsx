import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCategoriesByType } from '@/app/actions/categories'
import { getRecurringPaymentsForMonth } from '@/app/actions/recurring-payments'
import { MonthStepper } from '@/components/forms/month-stepper'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { Card, CardContent } from '@/components/ui/card'
import { parseMonthYearParams, getMonthTitle } from '@/lib/date-utils'
import { RecurringPaymentsContent } from './recurring-payments-content'

export default async function PagamentosRecorrentesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const { month, year } = parseMonthYearParams(params.month, params.year)

  const [categories, data] = await Promise.all([
    getCategoriesByType('expense'),
    getRecurringPaymentsForMonth(month, year),
  ])

  if (!data) redirect('/login')

  const monthTitle = getMonthTitle(year, month)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title="Pagamentos recorrentes"
        description="Acompanhe contas mensais, marque como pagas para lançar saídas e veja o total a provisionar no mês."
      />

      <Card className="dashboard-bento-card-hero h-fit lg:sticky lg:top-24">
        <CardContent className="flex flex-col gap-4 py-4 sm:py-5">
          <div>
            <p className="dashboard-section-label text-primary/80">Mês em edição</p>
            <p className="text-lg font-semibold">
              {monthTitle} de {year}
            </p>
          </div>
          <div className="w-full min-w-0">
            <MonthStepper />
          </div>
        </CardContent>
      </Card>

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
