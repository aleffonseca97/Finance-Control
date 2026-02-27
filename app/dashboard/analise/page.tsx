import { getFixedVsVariable, getExpensesByCategory, getMonthComparison } from '@/app/actions/analysis'
import { FixedVariableChart } from '@/components/charts/fixed-variable-chart'
import { ExpensesByCategoryChart } from '@/components/charts/expenses-by-category-chart'
import { MonthFilter } from '@/components/forms/month-filter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Análise Financeira</h1>
          <p className="text-muted-foreground">Despesas fixas vs variáveis, comparativos e indicadores</p>
        </div>
        <MonthFilter />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Despesas fixas vs variáveis</CardTitle>
          </CardHeader>
          <CardContent>
            <FixedVariableChart fixed={fixedVsVariable.fixed} variable={fixedVsVariable.variable} />
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Fixas</p>
                <p className="text-lg font-semibold text-violet-500">
                  R$ {fixedVsVariable.fixed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{fixedPercent.toFixed(1)}% do total</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-muted-foreground">Variáveis</p>
                <p className="text-lg font-semibold text-orange-500">
                  R$ {fixedVsVariable.variable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground">{variablePercent.toFixed(1)}% do total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Comparativo com mês anterior</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Entradas (mês atual)</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-emerald-500">
                    R$ {comparison.current.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {comparison.previous.income > 0 && (
                    <span className={`text-sm ${incomeChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-sm text-muted-foreground mb-1">Saídas (mês atual)</p>
                <div className="flex items-baseline justify-between">
                  <p className="text-xl font-bold text-red-500">
                    R$ {comparison.current.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  {comparison.previous.expense > 0 && (
                    <span className={`text-sm ${expenseChange <= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 despesas por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <ExpensesByCategoryChart data={byCategory} />
        </CardContent>
      </Card>
    </div>
  )
}
