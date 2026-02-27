import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react'
import { getLastTransactions, getMonthlyEvolution } from '@/app/actions/analytics'
import { MonthlyEvolutionChart } from '@/components/charts/monthly-evolution-chart'
import { IncomeExpensePieChart } from '@/components/charts/pie-chart'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'

async function getDashboardData(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

  const [incomes, expenses, investments] = await Promise.all([
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
  ])

  const totalIncome = incomes._sum.amount ?? 0
  const totalExpense = expenses._sum.amount ?? 0
  const totalInvestment = investments._sum.amount ?? 0
  const balance = totalIncome - totalExpense - totalInvestment

  return { totalIncome, totalExpense, totalInvestment, balance }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [{ totalIncome, totalExpense, totalInvestment, balance }, lastTransactions, evolution] =
    await Promise.all([
      getDashboardData(session.user.id),
      getLastTransactions(10),
      getMonthlyEvolution(6),
    ])

  const cards = [
    { title: 'Entradas', value: totalIncome, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Saídas', value: totalExpense, icon: TrendingDown, color: 'text-red-500' },
    { title: 'Investimentos', value: totalInvestment, icon: PiggyBank, color: 'text-blue-500' },
    { title: 'Saldo do Mês', value: balance, icon: Wallet, color: balance >= 0 ? 'text-emerald-500' : 'text-red-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo financeiro do mês atual</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <IncomeExpensePieChart income={totalIncome} expense={totalExpense} />
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
      <Card>
        <CardHeader>
          <CardTitle>Evolução mensal (últimos 6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          <MonthlyEvolutionChart data={evolution} />
        </CardContent>
      </Card>
    </div>
  )
}
