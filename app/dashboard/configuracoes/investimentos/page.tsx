import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getReserveCategories, getWalletCategories } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function InvestimentosConfigPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [reserveCategories, walletCategories] = await Promise.all([
    getReserveCategories(),
    getWalletCategories(),
  ])

  return (
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Categorias de Investimentos</h1>
        <p className="text-muted-foreground">
          Gerencie reservas (objetivos) e carteiras (aplicações) para seus investimentos
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reservas</CardTitle>
            <p className="text-sm text-muted-foreground">
              Objetivos da economia: Reserva Emergência, Reserva Viagem, Reserva Longo Prazo, Compra Alto Valor, etc.
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={reserveCategories}
              type="investment"
              isFixed={false}
              title=""
              investmentSubtype="reserva"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carteiras</CardTitle>
            <p className="text-sm text-muted-foreground">
              Onde o dinheiro está aplicado: CDB, Poupança, Tesouro Direto, Ações, etc.
            </p>
          </CardHeader>
          <CardContent>
            <CategoryList
              categories={walletCategories}
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
