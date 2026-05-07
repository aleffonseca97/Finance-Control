import { Suspense } from 'react'
import { getCategoriesByType } from '@/app/actions/categories'
import { getTransactions, deleteTransaction } from '@/app/actions/transactions'
import { createIncome } from '@/app/actions/transactions'
import { MonthStepper } from '@/components/forms/month-stepper'
import { Card, CardContent } from '@/components/ui/card'
import { MonthCalendar } from '@/components/shared/month-calendar'
import { CalendarFallback } from '@/components/shared/calendar-fallback'
import { TransactionEntryForm } from '@/components/shared/transaction-entry-form'
import { TransactionListCard } from '@/components/shared/transaction-list-card'
import { parseMonthYearParams, getMonthTitle, groupByDay } from '@/lib/date-utils'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>
}) {
  const params = await searchParams

  const [categories, { transactions, total }] = await Promise.all([
    getCategoriesByType('income'),
    getTransactions('income', params.month ? parseInt(params.month, 10) : undefined, params.year ? parseInt(params.year, 10) : undefined),
  ])

  const { month, year, daysInMonth, selectedDay, now } = parseMonthYearParams(
    params.month,
    params.year,
    params.day,
  )

  const daysWithEntries = Object.keys(groupByDay(transactions)).map(Number)
  const monthTitle = getMonthTitle(year, month)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title="Entradas"
        description="Controle suas receitas"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:gap-8">
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
            <Suspense fallback={<CalendarFallback />}>
              <MonthCalendar
                year={year}
                month={month}
                daysInMonth={daysInMonth}
                selectedDay={selectedDay}
                daysWithEntries={daysWithEntries}
                todayYear={now.getFullYear()}
                todayMonth={now.getMonth()}
                todayDay={now.getDate()}
                accentColor="emerald"
                entryLabel="com lançamento"
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card min-w-0 shadow-md">
          <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <TransactionEntryForm
              type="income"
              categories={categories}
              selectedDay={selectedDay}
              month={month}
              year={year}
              action={createIncome}
              emptyCategoryMessage="Não há categorias de receita. Cadastre ao menos uma em Configurações para lançar entradas."
            />
          </CardContent>
        </Card>
      </div>

      <TransactionListCard
        title="Total do período"
        total={total}
        items={transactions}
        emptyMessage="Nenhuma entrada neste período"
        colorClass="text-emerald-500"
        onDelete={deleteTransaction}
        deleteConfirmMessage="Excluir esta transação?"
      />
    </div>
  )
}
