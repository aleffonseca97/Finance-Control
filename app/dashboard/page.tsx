import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, PiggyBank, Wallet, CreditCard } from 'lucide-react'
import { getLastTransactions, getMonthlyEvolution } from '@/app/actions/analytics'
import { ensureFixedExpensesForMonth } from '@/app/actions/transactions'
import { MonthlyEvolutionChart } from '@/components/charts/monthly-evolution-chart'
import { IncomeExpensePieChart } from '@/components/charts/pie-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { CategoryIcon } from '@/components/category/category-icon'

async function getDashboardData(userId: string) {
  const now = new Date()
  await ensureFixedExpensesForMonth(userId, now.getMonth(), now.getFullYear())
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [incomes, expenses, investments, creditCardExpenses, creditCardTransactions, creditCards] =
    await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, type: 'income', date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, type: 'expense', date: { gte: startOfMonth, lte: endOfMonth } },
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
      prisma.creditCard.findMany({
        where: { userId },
        select: { limit: true },
      }),
    ])

  const totalIncome = incomes._sum.amount ?? 0
  const totalExpense = expenses._sum.amount ?? 0
  const totalInvestment = investments._sum.amount ?? 0
  const creditCardTotal = creditCardExpenses._sum.amount ?? 0
  const creditCardLimit = creditCards.reduce((acc, cc) => acc + cc.limit, 0)
  const balance = totalIncome - totalExpense

  return {
    totalIncome,
    totalExpense,
    totalInvestment,
    creditCardTotal,
    creditCardLimit,
    creditCardTransactions,
    balance,
  }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [
    { totalIncome, totalExpense, totalInvestment, creditCardTotal, creditCardLimit, creditCardTransactions, balance },
    lastTransactions,
    evolution,
  ] =
    await Promise.all([
      getDashboardData(session.user.id),
      getLastTransactions(10, true),
      getMonthlyEvolution(6),
    ])

  const cards = [
    { title: 'Entradas', value: totalIncome, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Saídas', value: totalExpense, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Saldo do Mês', value: balance, icon: Wallet, color: balance >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { title: 'Investimentos', value: totalInvestment, icon: PiggyBank, color: 'text-blue-500' },
    { title: 'Limite Cartão de Crédito', value: creditCardLimit, icon: CreditCard, color: 'text-amber-500' },
  ]

  return (
    <div className="space-y-6 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo financeiro do mês atual</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${item.color}`}>
                  R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Entradas vs Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <IncomeExpensePieChart
              income={totalIncome}
              expense={totalExpense}
              creditCardExpense={creditCardTotal}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Últimas transações</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={lastTransactions} />
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader>
            <CardTitle>Evolução mensal (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyEvolutionChart data={evolution} />
          </CardContent>
        </Card>
        <Card className="lg:min-w-[320px]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Gastos com cartão</CardTitle>
            <CreditCard className="h-5 w-5 text-amber-500 shrink-0" />
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold text-amber-600">
              R$ {creditCardTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total do mês atual</p>
            {creditCardTransactions.length > 0 ? (
              <div className="space-y-2 pt-2 border-t">
                <p className="text-xs font-medium text-muted-foreground">Gastos recentes</p>
                {creditCardTransactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 py-1.5 rounded-md hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="rounded-full p-1.5 shrink-0"
                        style={{ backgroundColor: `${t.category.color}20` }}
                      >
                        <CategoryIcon icon={t.category.icon} size={14} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {t.description || t.category.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.creditCard?.name}
                          {t.creditCard?.lastFour ? ` •••• ${t.creditCard.lastFour}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-500 shrink-0">
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pt-2">Nenhum gasto com cartão no mês</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
