import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCategoriesByType, getUserCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function CategoriasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [expenseCategories, incomeCategories, allExpenseCategories, allIncomeCategories] = await Promise.all([
    getUserCategoriesByType('expense'),
    getUserCategoriesByType('income'),
    getCategoriesByType('expense'),
    getCategoriesByType('income'),
  ])

  const variableExpenses = expenseCategories.filter((c) => !c.isFixed)
  const fixedExpenses = expenseCategories.filter((c) => c.isFixed)
  const expenseGroups = Array.from(
    new Set(
      allExpenseCategories
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const incomeGroups = Array.from(
    new Set(
      allIncomeCategories
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Categorias"
        description="Gerencie as categorias de entradas e saídas"
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-1">
          <Card className="dashboard-bento-card shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Despesas variáveis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para gastos que variam de mês a mês
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={variableExpenses}
                availableGroups={expenseGroups}
                type="expense"
                isFixed={false}
                title=""
              />
            </CardContent>
          </Card>

          <Card className="dashboard-bento-card-muted shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Despesas fixas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para gastos recorrentes e previsíveis
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={fixedExpenses}
                availableGroups={expenseGroups}
                type="expense"
                isFixed={true}
                title=""
              />
            </CardContent>
          </Card>

          <Card className="dashboard-bento-card shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Opções de entrada</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para registrar suas receitas
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={incomeCategories}
                availableGroups={incomeGroups}
                type="income"
                isFixed={false}
                title=""
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
