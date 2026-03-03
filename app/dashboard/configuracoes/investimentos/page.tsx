import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function InvestimentosConfigPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const investmentCategories = await getCategoriesByType('investment')

  return (
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Categorias de Investimentos</h1>
        <p className="text-muted-foreground">
          Gerencie as categorias para registrar seus investimentos
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tipos de investimento</CardTitle>
            <p className="text-sm text-muted-foreground">
              Categorias como Reserva Emergência, CDB, Tesouro Direto, Ações, etc.
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={investmentCategories}
              type="investment"
              isFixed={false}
              title=""
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
