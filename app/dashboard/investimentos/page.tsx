import { getReserveCategories, getWalletCategories } from '@/app/actions/categories'
import {
  getInvestments,
  getInvestmentsSummary,
  createInvestment,
  createWithdrawal,
  deleteInvestment,
  getReserveWalletBalancesForUser,
} from '@/app/actions/investments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { InvestmentsPieChart } from '@/components/charts/investments-pie-chart'
import { InvestimentosGrid } from './investimentos-grid'
import { InvestmentListCard } from './investment-list-card'
import { parseMonthYearParams, getMonthTitle, groupByDay, formatBRL } from '@/lib/date-utils'
import { CalendarFallback } from '@/components/shared/calendar-fallback'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { chartCardClassName } from '@/components/charts/chart-shared'

export default async function InvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>
}) {
  const params = await searchParams

  const [
    reserveCategories,
    walletCategories,
    { investments, total },
    investmentsSummary,
    withdrawalBalances,
  ] = await Promise.all([
    getReserveCategories(),
    getWalletCategories(),
    getInvestments(
      params.month ? parseInt(params.month, 10) : undefined,
      params.year ? parseInt(params.year, 10) : undefined,
    ),
    getInvestmentsSummary(),
    getReserveWalletBalancesForUser(),
  ])

  const { month, year, daysInMonth, selectedDay, now } = parseMonthYearParams(
    params.month,
    params.year,
    params.day,
  )

  const daysWithEntries = Object.keys(groupByDay(investments)).map(Number)
  const monthTitle = getMonthTitle(year, month)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title="Investimentos"
        description="Acompanhe seus aportes"
      />

      <div className="min-w-0">
        <InvestimentosGrid
          monthLabel={`${monthTitle} de ${year}`}
          month={month}
          year={year}
          daysInMonth={daysInMonth}
          selectedDay={selectedDay}
          daysWithEntries={daysWithEntries}
          todayYear={now.getFullYear()}
          todayMonth={now.getMonth()}
          todayDay={now.getDate()}
          reserveCategories={reserveCategories}
          walletCategories={walletCategories}
          withdrawalBalances={withdrawalBalances}
          createInvestment={
            createInvestment as (
              formData: FormData,
            ) => Promise<{ error?: string; success?: boolean }>
          }
          createWithdrawal={
            createWithdrawal as (
              formData: FormData,
            ) => Promise<{ error?: string; success?: boolean }>
          }
          calendarFallback={<CalendarFallback />}
        />
      </div>

      <InvestmentListCard
        title="Total do período"
        total={total}
        investments={investments}
        emptyMessage="Nenhum aporte ou saque neste período"
        onDelete={deleteInvestment}
      />

      <Card className={`${chartCardClassName} overflow-hidden shadow-md`}>
        <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle className="text-base sm:text-lg">Total geral investido</CardTitle>
          <p className="text-xl font-bold text-blue-500 tabular-nums sm:text-2xl">
            R$ {formatBRL(investmentsSummary.total)}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {investmentsSummary.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              Você ainda não possui investimentos cadastrados
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-start">
              <ul className="min-w-0 space-y-2">
                {investmentsSummary.items.map((item) => (
                  <li
                    key={item.label ?? item.category.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="shrink-0 rounded-full p-2"
                        style={{
                          backgroundColor: `${item.category.color ?? '#3b82f6'}20`,
                        }}
                      >
                        <CategoryIcon
                          icon={item.category.icon}
                          className="text-foreground"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{item.label ?? item.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.label ? 'Reserva → Carteira' : 'Total investido na categoria'}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-blue-500">
                      R$ {formatBRL(item.total)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="dashboard-bento-card-muted min-w-0 p-3 sm:p-4">
                <InvestmentsPieChart
                  data={investmentsSummary.items.map((item) => ({
                    name: item.label ?? item.category.name,
                    value: item.total,
                    color: item.category.color,
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
