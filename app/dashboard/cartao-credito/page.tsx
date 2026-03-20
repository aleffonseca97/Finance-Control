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
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Cartão de Crédito</h1>
        <p className="text-muted-foreground">
          Fatura no orçamento após o fechamento; pagamento com caixa restaura o limite
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cartões e pagamentos</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fechamento gera a despesa variável; vencimento em atraso dispara o alerta
            </p>
          </CardHeader>
          <CardContent>
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
