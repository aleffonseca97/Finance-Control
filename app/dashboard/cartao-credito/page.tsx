import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCreditCardPagePayload } from '@/app/actions/credit-cards'
import { ensureUserCategories } from '@/app/actions/categories'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function CartaoCreditoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await ensureUserCategories(session.user.id)

  const payload = await getCreditCardPagePayload()
  if (!payload) redirect('/login')

  const { cards, availableCash, overdueNotices } = payload

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Cartão de Crédito"
        description="Compras não entram no orçamento de caixa; o pagamento da fatura registra saída e restaura o limite"
      />

      <div className="space-y-6">
        <Card className="dashboard-bento-card overflow-hidden shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Cartões e pagamentos</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Fechamento e vencimento são referência no cadastro; atraso com saldo em aberto pode gerar alerta
            </p>
          </CardHeader>
          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
            <CreditCardList
              cards={cards}
              availableCash={availableCash}
              overdueNotices={overdueNotices}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
