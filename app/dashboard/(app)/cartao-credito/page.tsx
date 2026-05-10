import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCreditCardPagePayload } from '@/app/actions/credit-cards'
import { ensureGlobalCategories } from '@/app/actions/categories'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { CreditCardMainCategoriesPieChart } from '@/components/charts/credit-card-main-categories-pie-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function CartaoCreditoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await ensureGlobalCategories()

  const payload = await getCreditCardPagePayload()
  if (!payload) redirect('/login')

  const { cards, availableCash, overdueNotices, creditCardCategorySpending } = payload

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Cartão de Crédito"
        description="Compras não entram no orçamento de caixa; o pagamento da fatura registra saída e restaura o limite"
      />

      <div className="space-y-6">
        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="space-y-1.5 p-4 sm:p-6">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Meus cartões e faturas
            </CardTitle>
            <CardDescription>
              Limites, datas de fechamento e vencimento; atrasos com saldo em aberto
              geram alerta no painel.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardList
              cards={cards}
              availableCash={availableCash}
              overdueNotices={overdueNotices}
            />
          </CardContent>
        </Card>

        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="space-y-1.5 p-4 sm:p-6">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Compras agrupadas por categoria principal
            </CardTitle>
            <CardDescription>
              Distribuição do que foi gasto no crédito, somando subcategorias sob cada
              grupo principal.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardMainCategoriesPieChart data={creditCardCategorySpending} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
