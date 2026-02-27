import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getCreditCards } from '@/app/actions/credit-cards'
import { CreditCardForm } from '@/components/credit-card/credit-card-form'
import { CreditCardList } from '@/components/credit-card/credit-card-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CartaoCreditoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const creditCards = await getCreditCards()

  return (
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Cartão de Crédito</h1>
        <p className="text-muted-foreground">Cadastre e gerencie seus cartões</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Novo cartão</CardTitle>
            <p className="text-sm text-muted-foreground">
              Adicione um cartão para acompanhar limite, fechamento e vencimento
            </p>
          </CardHeader>
          <CardContent>
            <CreditCardList cards={creditCards} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
