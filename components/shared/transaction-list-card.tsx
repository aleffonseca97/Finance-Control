'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryIcon } from '@/components/category/category-icon'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatBRL, formatDateBR } from '@/lib/date-utils'

type TransactionItem = {
  id: string
  amount: number
  description: string | null
  date: Date | string
  category: { name: string; color: string | null; icon: string }
  creditCard?: { name: string; lastFour: string | null } | null
  paysCreditCard?: { name: string; lastFour: string | null } | null
}

type Props = {
  title: string
  total: number
  items: TransactionItem[]
  emptyMessage: string
  colorClass: string
  onDelete: (id: string) => Promise<unknown>
  deleteConfirmMessage: string
}

export function TransactionListCard({
  title,
  total,
  items,
  emptyMessage,
  colorClass,
  onDelete,
  deleteConfirmMessage,
}: Props) {
  return (
    <Card className="dashboard-bento-card-muted overflow-hidden shadow-md">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className={`text-xl font-bold tabular-nums sm:text-2xl ${colorClass}`}>
          R$ {formatBRL(total)}
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">
            {emptyMessage}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border">
            {items.map((t) => (
              <li
                key={t.id}
                className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 hover:bg-muted/50"
              >
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div
                    className="shrink-0 rounded-full p-2"
                    style={{ backgroundColor: `${t.category.color}20` }}
                  >
                    <CategoryIcon
                      icon={t.category.icon}
                      className="text-foreground"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{t.category.name}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {t.description || formatDateBR(t.date)}
                      {t.creditCard && (
                        <span className="text-amber-600 dark:text-amber-500">
                          {' '}• Cartão: {t.creditCard.name}
                          {t.creditCard.lastFour
                            ? ` •••• ${t.creditCard.lastFour}`
                            : ''}
                        </span>
                      )}
                      {t.paysCreditCard && (
                        <span className="text-emerald-600 dark:text-emerald-500">
                          {' '}• Pagamento fatura: {t.paysCreditCard.name}
                          {t.paysCreditCard.lastFour
                            ? ` •••• ${t.paysCreditCard.lastFour}`
                            : ''}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                  <span className={`font-semibold tabular-nums ${colorClass}`}>
                    R$ {formatBRL(t.amount)}
                  </span>
                  <DeleteConfirmButton
                    confirmMessage={deleteConfirmMessage}
                    onDelete={() => onDelete(t.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
