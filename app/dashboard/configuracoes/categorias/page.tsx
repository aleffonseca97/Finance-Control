import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CategoriasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategoriesByType('expense'),
    getCategoriesByType('income'),
  ])

  const variableExpenses = expenseCategories.filter((c) => !c.isFixed)
  const fixedExpenses = expenseCategories.filter((c) => c.isFixed)

  return (
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Categorias</h1>
        <p className="text-muted-foreground">
          Gerencie as categorias de entradas e saídas
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas variáveis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para gastos que variam de mês a mês
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={variableExpenses}
                type="expense"
                isFixed={false}
                title=""
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Despesas fixas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para gastos recorrentes e previsíveis
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={fixedExpenses}
                type="expense"
                isFixed={true}
                title=""
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Opções de entrada</CardTitle>
              <p className="text-sm text-muted-foreground">
                Categorias para registrar suas receitas
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={incomeCategories}
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
