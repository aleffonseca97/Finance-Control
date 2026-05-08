import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getReserveCategories, getWalletCategories } from '@/app/actions/categories'
import { getRecurringInvestmentsForMonth } from '@/app/actions/recurring-investments'
import { MonthStepper } from '@/components/forms/month-stepper'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { Card, CardContent } from '@/components/ui/card'
import { parseMonthYearParams, getMonthTitle } from '@/lib/date-utils'
import { RecurringInvestmentsContent } from './recurring-investments-content'

export default async function RecorrenciaInvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const { month, year } = parseMonthYearParams(params.month, params.year)

  const [reserveCategories, walletCategories, data] = await Promise.all([
    getReserveCategories(),
    getWalletCategories(),
    getRecurringInvestmentsForMonth(month, year),
  ])
  if (!data) redirect('/login')

  const monthTitle = getMonthTitle(year, month)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title="Recorrência de investimentos"
        description="Configure aportes mensais fixos ou por percentual das entradas do mês."
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
