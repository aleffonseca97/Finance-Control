import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { CreditCard } from 'lucide-react'
import { formatBRL } from '@/lib/date-utils'

type CreditCardTransaction = {
  id: string
  amount: number
  description: string | null
  category: { name: string; color: string; icon: string }
  creditCard?: { name: string; lastFour: string | null } | null
}

type Props = {
  total: number
  transactions: CreditCardTransaction[]
}

export function CreditCardSpending({ total, transactions }: Props) {
  return (
    <Card className="dashboard-bento-card-muted lg:min-w-[320px] shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Gastos com cartão</CardTitle>
        <CreditCard className="h-5 w-5 text-amber-500 shrink-0" aria-hidden />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-2xl font-bold text-amber-600">
          R$ {formatBRL(total)}
        </p>
        <p className="text-xs text-muted-foreground">
          Compras no cartão no mês (fora do orçamento de caixa até você pagar a fatura)
        </p>
        {transactions.length > 0 ? (
          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              Gastos recentes
            </p>
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between gap-2 py-1.5 rounded-md hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="rounded-full p-1.5 shrink-0"
                    style={{ backgroundColor: `${t.category.color}20` }}
                  >
                    <CategoryIcon icon={t.category.icon} size={14} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {t.description || t.category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.creditCard?.name}
                      {t.creditCard?.lastFour
                        ? ` •••• ${t.creditCard.lastFour}`
                        : ''}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-red-500 shrink-0">
                  R$ {formatBRL(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground pt-2">
            Nenhum gasto com cartão no mês
          </p>
        )}
      </CardContent>
    </Card>
  )
}
