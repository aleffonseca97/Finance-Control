import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCreditCardPagePayload } from '@/app/actions/credit-cards'
import { ensureUserCategories } from '@/app/actions/categories'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CartaoCreditoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  await ensureUserCategories(session.user.id)

  const payload = await getCreditCardPagePayload()
  if (!payload) redirect('/login')

  const { cards, availableCash, overdueNotices } = payload

  return (
    <div className="space-y-6 p-4 pt-6 sm:p-6 sm:pt-8 md:p-8 md:pt-10">
      <div className="space-y-1">
        <h1 className="text-xl font-bold sm:text-2xl">Cartão de Crédito</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Fatura no orçamento após o fechamento; pagamento com caixa restaura o limite
        </p>
      </div>

      <div className="space-y-6">
        <Card className="overflow-hidden">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-base sm:text-lg">Cartões e pagamentos</CardTitle>
            <p className="text-xs text-muted-foreground sm:text-sm">
              Fechamento gera a despesa variável; vencimento em atraso dispara o alerta
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
