import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getCategoriesByType, getUserCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function InvestimentosConfigPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [investmentCategories, allInvestmentCategories] = await Promise.all([
    getUserCategoriesByType('investment'),
    getCategoriesByType('investment'),
  ])
  const reserveCategories = investmentCategories.filter(
    (cat) => cat.investmentSubtype === 'reserva'
  )
  const walletCategories = investmentCategories.filter(
    (cat) => cat.investmentSubtype === 'carteira'
  )
  const reserveGroups = Array.from(
    new Set(
      allInvestmentCategories
        .filter((category) => category.investmentSubtype === 'reserva')
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  const walletGroups = Array.from(
    new Set(
      allInvestmentCategories
        .filter((category) => category.investmentSubtype === 'carteira')
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => a.localeCompare(b, 'pt-BR'))

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Categorias de Investimentos"
        description="Gerencie reservas (objetivos) e carteiras (aplicações) para seus investimentos"
      />

      <div className="space-y-6">
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Reservas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Objetivos da economia: Reserva Emergência, Reserva Viagem, Reserva Longo Prazo, Compra Alto Valor, etc.
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={reserveCategories}
              availableGroups={reserveGroups}
              type="investment"
              isFixed={false}
              title=""
              investmentSubtype="reserva"
            />
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Carteiras</CardTitle>
            <p className="text-sm text-muted-foreground">
              Onde o dinheiro está aplicado: CDB, Poupança, Tesouro Direto, Ações, etc.
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={walletCategories}
              availableGroups={walletGroups}
              type="investment"
              isFixed={false}
              title=""
              investmentSubtype="carteira"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
