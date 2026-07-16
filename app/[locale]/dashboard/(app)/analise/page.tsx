import { getFixedVsVariable, getExpensesByCategory, getMonthComparison } from '@/app/actions/analysis'
import { FixedVariableChart } from '@/components/charts/fixed-variable-chart'
import { ExpensesByCategoryChart } from '@/components/charts/expenses-by-category-chart'
import { MonthFilter } from '@/components/forms/month-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { chartCardClassName } from '@/components/charts/chart-shared'
import { getLocale, getTranslations } from 'next-intl/server'
import { formatCurrency, formatNumber } from '@/lib/i18n/format'
import { getCurrentCurrency } from '@/lib/i18n/get-currency'
import type { AppLocale } from '@/i18n/routing'

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const t = await getTranslations('dashboard.analysis')
  const locale = (await getLocale()) as AppLocale
  const currency = await getCurrentCurrency()
  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const [fixedVsVariable, byCategory, comparison] = await Promise.all([
    getFixedVsVariable(month, year),
    getExpensesByCategory(month, year),
    getMonthComparison(month, year),
  ])

  const totalExpense = fixedVsVariable.fixed + fixedVsVariable.variable
  const fixedPercent = totalExpense > 0 ? (fixedVsVariable.fixed / totalExpense) * 100 : 0
  const variablePercent = totalExpense > 0 ? (fixedVsVariable.variable / totalExpense) * 100 : 0

  const incomeChange = comparison.previous.income > 0
    ? ((comparison.current.income - comparison.previous.income) / comparison.previous.income) * 100
    : 0
  const expenseChange = comparison.previous.expense > 0
    ? ((comparison.current.expense - comparison.previous.expense) / comparison.previous.expense) * 100
    : 0
  const incomeDiff = comparison.current.income - comparison.previous.income
  const expenseDiff = comparison.current.expense - comparison.previous.expense
  const hasIncomeBaseline = comparison.previous.income > 0
  const hasExpenseBaseline = comparison.previous.expense > 0

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
        actions={<MonthFilter />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`${chartCardClassName} shadow-md`}>
          <CardHeader>
            <CardTitle>{t('fixedVsVariable')}</CardTitle>
          </CardHeader>
          <CardContent>
            <FixedVariableChart fixed={fixedVsVariable.fixed} variable={fixedVsVariable.variable} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="dashboard-bento-card-muted p-3">
                <p className="text-muted-foreground">{t('fixed')}</p>
                <p className="text-lg font-semibold text-violet-500">
                  {formatCurrency(fixedVsVariable.fixed, locale, currency)}
                </p>
                <p className="text-xs text-muted-foreground">{t('percentOfTotal', { percent: formatNumber(fixedPercent, locale) })}</p>
              </div>
              <div className="dashboard-bento-card-muted p-3">
                <p className="text-muted-foreground">{t('variable')}</p>
                <p className="text-lg font-semibold text-orange-500">
                  {formatCurrency(fixedVsVariable.variable, locale, currency)}
                </p>
                <p className="text-xs text-muted-foreground">{t('percentOfTotal', { percent: formatNumber(variablePercent, locale) })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader>
            <CardTitle>{t('monthComparison')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="dashboard-bento-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">{t('currentMonthIncome')}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-emerald-500">
                    {formatCurrency(comparison.current.income, locale, currency)}
                  </p>
                  <span className={`text-sm ${hasIncomeBaseline ? (incomeChange >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                    {hasIncomeBaseline ? `${incomeChange >= 0 ? '+' : ''}${formatNumber(incomeChange, locale)}%` : t('noBaseline')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('previousMonthAmount', { amount: formatCurrency(comparison.previous.income, locale, currency) })}
                </p>
                <p className={`text-xs ${incomeDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {incomeDiff >= 0 ? '+' : ''}{formatCurrency(incomeDiff, locale, currency)}
                </p>
              </div>
              <div className="dashboard-bento-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">{t('currentMonthExpense')}</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-red-500">
                    {formatCurrency(comparison.current.expense, locale, currency)}
                  </p>
                  <span className={`text-sm ${hasExpenseBaseline ? (expenseChange <= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                    {hasExpenseBaseline ? `${expenseChange >= 0 ? '+' : ''}${formatNumber(expenseChange, locale)}%` : t('noBaseline')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('previousMonthAmount', { amount: formatCurrency(comparison.previous.expense, locale, currency) })}
                </p>
                <p className={`text-xs ${expenseDiff <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {expenseDiff >= 0 ? '+' : ''}{formatCurrency(expenseDiff, locale, currency)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`${chartCardClassName} shadow-md`}>
        <CardHeader>
          <CardTitle>{t('topExpenses')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesByCategoryChart data={byCategory} />
        </CardContent>
      </Card>
    </div>
  )
}
