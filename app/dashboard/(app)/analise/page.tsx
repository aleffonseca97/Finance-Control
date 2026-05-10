import { getFixedVsVariable, getExpensesByCategory, getMonthComparison } from '@/app/actions/analysis'
import { FixedVariableChart } from '@/components/charts/fixed-variable-chart'
import { ExpensesByCategoryChart } from '@/components/charts/expenses-by-category-chart'
import { MonthFilter } from '@/components/forms/month-filter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { chartCardClassName } from '@/components/charts/chart-shared'

export default async function AnalisePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
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
        title="Análise Financeira"
        description="Despesas fixas vs variáveis, comparativos e indicadores"
        actions={<MonthFilter />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className={`${chartCardClassName} shadow-md`}>
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Estrutura de gastos: fixo versus variável
            </CardTitle>
            <CardDescription>
              Veja quanto do orçamento é previsível (contas fixas) e quanto flutua
              com o dia a dia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FixedVariableChart fixed={fixedVsVariable.fixed} variable={fixedVsVariable.variable} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="dashboard-bento-card-muted p-3">
                <p className="text-muted-foreground">Fixas</p>
                <p className="text-lg font-semibold text-violet-500">
                  R$ {fixedVsVariable.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{fixedPercent.toFixed(1)}% do total</p>
              </div>
              <div className="dashboard-bento-card-muted p-3">
                <p className="text-muted-foreground">Variáveis</p>
                <p className="text-lg font-semibold text-orange-500">
                  R$ {fixedVsVariable.variable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{variablePercent.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Ritmo em relação ao mês anterior
            </CardTitle>
            <CardDescription>
              Comparativo de entradas e saídas com variação percentual e em reais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="dashboard-bento-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Entradas (mês atual)</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-emerald-500">
                    R$ {comparison.current.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-sm ${hasIncomeBaseline ? (incomeChange >= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                    {hasIncomeBaseline ? `${incomeChange >= 0 ? '+' : ''}${incomeChange.toFixed(1)}%` : 'Sem base anterior'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mês anterior: R$ {comparison.previous.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${incomeDiff >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {incomeDiff >= 0 ? '+' : ''}R$ {incomeDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="dashboard-bento-card p-4 shadow-sm">
                <p className="text-sm text-muted-foreground mb-1">Saídas (mês atual)</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-red-500">
                    R$ {comparison.current.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-sm ${hasExpenseBaseline ? (expenseChange <= 0 ? 'text-emerald-500' : 'text-red-500') : 'text-muted-foreground'}`}>
                    {hasExpenseBaseline ? `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%` : 'Sem base anterior'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Mês anterior: R$ {comparison.previous.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className={`text-xs ${expenseDiff <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {expenseDiff >= 0 ? '+' : ''}R$ {expenseDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className={`${chartCardClassName} shadow-md`}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
            Onde o dinheiro está saindo mais
          </CardTitle>
          <CardDescription>
            As cinco categorias de despesa com maior peso no período filtrado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExpensesByCategoryChart data={byCategory} />
        </CardContent>
      </Card>
    </div>
  )
}
