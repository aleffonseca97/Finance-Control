import { Suspense } from 'react'
import { getCategoriesByType } from '@/app/actions/categories'
import { getCreditCards } from '@/app/actions/credit-cards'
import { getTransactions, deleteTransaction, createExpense } from '@/app/actions/transactions'
import { MonthStepper } from '@/components/forms/month-stepper'
import { Card, CardContent } from '@/components/ui/card'
import { MonthCalendar } from '@/components/shared/month-calendar'
import { CalendarFallback } from '@/components/shared/calendar-fallback'
import { TransactionEntryForm } from '@/components/shared/transaction-entry-form'
import { TransactionListCard } from '@/components/shared/transaction-list-card'
import { parseMonthYearParams, getMonthTitle, groupByDay } from '@/lib/date-utils'

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>
}) {
  const params = await searchParams

  const [categories, creditCards, { transactions, total }] = await Promise.all([
    getCategoriesByType('expense'),
    getCreditCards(),
    getTransactions('expense', params.month ? parseInt(params.month, 10) : undefined, params.year ? parseInt(params.year, 10) : undefined),
  ])

  const { month, year, daysInMonth, selectedDay, now } = parseMonthYearParams(
    params.month,
    params.year,
    params.day,
  )

  const daysWithEntries = Object.keys(groupByDay(transactions)).map(Number)
  const monthTitle = getMonthTitle(year, month)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-2 sm:py-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saídas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Controle suas despesas
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:gap-8">
        <Card className="border-primary/40 bg-primary/5 h-fit lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-4 py-4 sm:py-5">
            <div>
              <p className="text-xs font-medium uppercase text-primary/70 tracking-wide">
                Mês em edição
              </p>
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

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <TransactionEntryForm
              type="expense"
              categories={categories}
              creditCards={creditCards}
              selectedDay={selectedDay}
              month={month}
              year={year}
              action={createExpense}
              emptyCategoryMessage="Não há categorias de despesa. Cadastre ao menos uma em Configurações para lançar saídas."
            />
          </CardContent>
        </Card>
      </div>

      <TransactionListCard
        title="Total do período"
        total={total}
        items={transactions}
        emptyMessage="Nenhuma saída neste período"
        colorClass="text-red-500"
        onDelete={deleteTransaction}
        deleteConfirmMessage="Excluir esta transação?"
      />
    </div>
  )
}
