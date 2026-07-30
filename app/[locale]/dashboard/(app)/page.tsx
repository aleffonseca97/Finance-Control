import { auth } from '@/lib/auth'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getLastTransactions, getMonthlyEvolution } from '@/app/actions/analytics'
import { ensureFixedExpensesForMonth } from '@/app/actions/transactions'
import { budgetExpenseWhere } from '@/lib/budget-expense'
import { formatCurrency } from '@/lib/i18n/format'
import { getCurrentCurrency } from '@/lib/i18n/get-currency'
import { MonthlyEvolutionChart } from '@/components/charts/monthly-evolution-chart'
import { IncomeExpensePieChart } from '@/components/charts/pie-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CreditCardSpending } from '@/components/dashboard/credit-card-spending'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { chartCardClassName } from '@/components/charts/chart-shared'
import type { TransactionWithCategory } from '@/lib/transaction-types'
import { getTranslations, getLocale } from 'next-intl/server'
import type { AppLocale } from '@/i18n/routing'

async function getDashboardData(userId: string) {
  const now = new Date()
  await ensureFixedExpensesForMonth(userId, now.getMonth(), now.getFullYear())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    incomes,
    expenses,
    investmentsAffectingCash,
    creditCardExpenses,
    creditCardTransactions,
    creditCards,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'income', date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth }, ...budgetExpenseWhere },
      _sum: { amount: true },
    }),
    prisma.investment.aggregate({
      where: {
        userId,
        date: { gte: startOfMonth, lte: endOfMonth },
        affectsCash: true,
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId,
        type: 'expense',
        creditCardId: { not: null },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: {
        userId,
        type: 'expense',
        creditCardId: { not: null },
        date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { category: true, creditCard: true },
      orderBy: { date: 'desc' },
      take: 5,
    }),
    prisma.creditCard.findMany({ where: { userId } }),
  ])

  const totalIncome = incomes._sum.amount ?? 0
  const totalExpense = expenses._sum.amount ?? 0
  const cashInvestment = investmentsAffectingCash._sum.amount ?? 0
  const creditCardTotal = creditCardExpenses._sum.amount ?? 0
  const creditCardTotalLine = creditCards.reduce(
    (acc, cc) => acc + (cc.totalLimit ?? cc.limit),
    0,
  )
  // Summary shows month spending on cards; footnote shows contracted limit.
  const creditCardLimit = creditCardTotal

  return {
    totalIncome,
    totalExpense,
    totalInvestment: cashInvestment,
    creditCardTotal,
    creditCardLimit,
    creditCardTotalLine,
    creditCardTransactions,
    balance: totalIncome - totalExpense - cashInvestment,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const locale = (await getLocale()) as AppLocale
  const currency = await getCurrentCurrency()

  const [data, lastTransactions, evolution, t] = await Promise.all([
    getDashboardData(session.user.id),
    getLastTransactions(10, true),
    getMonthlyEvolution(6),
    getTranslations('dashboard.overview'),
  ])

  const appLocale = locale
  const userName =
    session.user.name?.split(' ')?.[0] || session.user.name || t('defaultUser')

  const summaryCards = [
    {
      title: t('balance'),
      value: data.balance,
      iconName: 'wallet' as const,
      color: data.balance >= 0 ? 'text-emerald-500' : 'text-red-500',
      action: 'statement' as const,
    },
    {
      title: t('creditLimit'),
      value: data.creditCardLimit,
      footnote: t('creditLimitFootnote', {
        amount: formatCurrency(data.creditCardTotalLine, appLocale, currency),
      }),
      iconName: 'credit-card' as const,
      color: 'text-amber-500',
      action: 'credit-card' as const,
    },
    {
      title: t('incomes'),
      value: data.totalIncome,
      iconName: 'trending-up' as const,
      color: 'text-emerald-500',
      action: 'incomes' as const,
    },
    {
      title: t('expenses'),
      value: data.totalExpense,
      iconName: 'trending-down' as const,
      color: 'text-red-500',
      action: 'expenses' as const,
    },
    {
      title: t('investments'),
      value: data.totalInvestment,
      iconName: 'piggy-bank' as const,
      color: 'text-blue-500',
      action: 'investments' as const,
    },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('welcome', { name: userName })}
        description={t('description')}
      />

      <section className="space-y-3">
        <p className="dashboard-section-label">{t('monthSummary')}</p>
        <SummaryCards
          items={summaryCards}
          statementTransactions={lastTransactions as TransactionWithCategory[]}
        />
      </section>

      <section className="space-y-3">
        <p className="dashboard-section-label">{t('activity')}</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={chartCardClassName}>
            <CardHeader>
              <CardTitle className="text-lg">{t('incomeVsExpense')}</CardTitle>
            </CardHeader>
            <CardContent>
              <IncomeExpensePieChart
                income={data.totalIncome}
                expense={data.totalExpense}
                creditCardExpense={0}
              />
            </CardContent>
          </Card>
          <Card className="dashboard-bento-card-muted">
            <CardHeader>
              <CardTitle className="text-lg">{t('recentTransactions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentTransactions
                transactions={lastTransactions as TransactionWithCategory[]}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        <p className="dashboard-section-label">{t('trends')}</p>
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,320px)]">
          <Card className={chartCardClassName}>
            <CardHeader>
              <CardTitle className="text-lg">{t('monthlyEvolution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyEvolutionChart data={evolution} />
            </CardContent>
          </Card>
          <CreditCardSpending
            total={data.creditCardTotal}
            transactions={data.creditCardTransactions}
          />
        </div>
      </section>
    </div>
  )
}
