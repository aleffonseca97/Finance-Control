import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Wallet,
  CreditCard,
} from 'lucide-react'
import { getLastTransactions, getMonthlyEvolution } from '@/app/actions/analytics'
import { ensureFixedExpensesForMonth } from '@/app/actions/transactions'
import { getCreditCardOverdueNotices } from '@/app/actions/credit-cards'
import { serializeOverdueNotices } from '@/lib/credit-card-overdue'
import { budgetExpenseWhere } from '@/lib/budget-expense'
import { formatBRL } from '@/lib/date-utils'
import { MonthlyEvolutionChart } from '@/components/charts/monthly-evolution-chart'
import { IncomeExpensePieChart } from '@/components/charts/pie-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { SummaryCards } from '@/components/dashboard/summary-cards'
import { CreditCardSpending } from '@/components/dashboard/credit-card-spending'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { chartCardClassName } from '@/components/charts/chart-shared'
import { OverdueBanner } from '@/components/shared/overdue-banner'
import type { TransactionWithCategory } from '@/lib/transaction-types'

async function getDashboardData(userId: string) {
  const now = new Date()
  await ensureFixedExpensesForMonth(userId, now.getMonth(), now.getFullYear())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [
    incomes,
    expenses,
    investments,
    creditCardExpenses,
    creditCardTransactions,
    creditCards,
    overdueRaw,
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
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
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
    getCreditCardOverdueNotices(userId),
  ])

  const totalIncome = incomes._sum.amount ?? 0
  const totalExpense = expenses._sum.amount ?? 0
  const totalInvestment = investments._sum.amount ?? 0
  const creditCardTotal = creditCardExpenses._sum.amount ?? 0
  const creditCardLimit = creditCards.reduce((acc, cc) => acc + cc.limit, 0)
  const creditCardTotalLine = creditCards.reduce(
    (acc, cc) => acc + ((cc as { totalLimit?: number }).totalLimit ?? cc.limit),
    0,
  )

  return {
    totalIncome,
    totalExpense,
    totalInvestment,
    creditCardTotal,
    creditCardLimit,
    creditCardTotalLine,
    creditCardTransactions,
    balance: totalIncome - totalExpense - totalInvestment,
    overdueNotices: serializeOverdueNotices(overdueRaw),
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [data, lastTransactions, evolution] = await Promise.all([
    getDashboardData(session.user.id),
    getLastTransactions(10, true),
    getMonthlyEvolution(6),
  ])

  const userName =
    session.user.name?.split(' ')?.[0] || session.user.name || 'Usuário'

  const summaryCards = [
    {
      title: 'Saldo do Mês',
      value: data.balance,
      icon: Wallet,
      color: data.balance >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      title: 'Limite disponível (cartões)',
      value: data.creditCardLimit,
      footnote: `Total contratado: R$ ${formatBRL(data.creditCardTotalLine)}`,
      icon: CreditCard,
      color: 'text-amber-500',
    },
    { title: 'Entradas', value: data.totalIncome, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Saídas', value: data.totalExpense, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Investimentos', value: data.totalInvestment, icon: PiggyBank, color: 'text-blue-500' },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={`Bem-vindo, ${userName}`}
        description="Aqui está a sua visão geral do mês atual."
      />

      <OverdueBanner notices={data.overdueNotices} />
      <section className="space-y-3">
        <p className="dashboard-section-label">Resumo do mês</p>
        <SummaryCards items={summaryCards} />
      </section>

      <section className="space-y-3">
        <p className="dashboard-section-label">Atividade</p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className={chartCardClassName}>
            <CardHeader>
              <CardTitle className="text-lg">Entradas vs Saídas</CardTitle>
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
              <CardTitle className="text-lg">Últimas transações</CardTitle>
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
        <p className="dashboard-section-label">Tendências</p>
        <div className="grid gap-4 lg:grid-cols-[1fr_minmax(280px,320px)]">
          <Card className={chartCardClassName}>
            <CardHeader>
              <CardTitle className="text-lg">Evolução mensal (últimos 6 meses)</CardTitle>
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
