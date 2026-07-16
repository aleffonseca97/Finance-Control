import { Suspense } from 'react'
import { getTranslations, getLocale } from 'next-intl/server'
import { getCategoriesByType } from '@/app/actions/categories'
import { getCreditCards } from '@/app/actions/credit-cards'
import { getTransactions, deleteTransaction, createExpense } from '@/app/actions/transactions'
import { MonthStepper } from '@/components/forms/month-stepper'
import { Card, CardContent } from '@/components/ui/card'
import { MonthCalendar } from '@/components/shared/month-calendar'
import { CalendarFallback } from '@/components/shared/calendar-fallback'
import { TransactionEntryForm } from '@/components/shared/transaction-entry-form'
import { parseMonthYearParams, getMonthTitle, groupByDay } from '@/lib/date-utils'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { ExpensePeriodTableCard } from './expense-period-table-card'
import type { AppLocale } from '@/i18n/routing'

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>
}) {
  const params = await searchParams
  const [t, tShared, locale] = await Promise.all([
    getTranslations('dashboard.expenses'),
    getTranslations('dashboard.shared'),
    getLocale(),
  ])
  const appLocale = locale as AppLocale

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
  const monthTitle = getMonthTitle(year, month, appLocale)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader title={t('title')} description={t('description')} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:gap-8">
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
                entryLabel={tShared('withEntry')}
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card min-w-0 shadow-md">
          <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <TransactionEntryForm
              type="expense"
              categories={categories}
              creditCards={creditCards}
              selectedDay={selectedDay}
              month={month}
              year={year}
              action={createExpense}
              emptyCategoryMessage={tShared('emptyExpenseCategories')}
            />
          </CardContent>
        </Card>
      </div>

      <ExpensePeriodTableCard
        title={t('periodTotal')}
        total={total}
        items={transactions}
        categories={categories}
        emptyMessage={tShared('noExpensesInPeriod')}
        onDelete={deleteTransaction}
        deleteConfirmMessage={tShared('deleteTransaction')}
      />
    </div>
  )
}
