import { getCategoriesByType } from '@/app/actions/categories'
import { getTransactions, createExpense } from '@/app/actions/transactions'
import { TransactionForm } from '@/components/forms/transaction-form'
import { MonthFilter } from '@/components/forms/month-filter'
import { DeleteTransactionButton } from '@/components/forms/delete-transaction-button'
import { CategoryIcon } from '@/components/category/category-icon'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const [categories, { transactions, total }] = await Promise.all([
    getCategoriesByType('expense'),
    getTransactions('expense', month, year),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Saídas</h1>
          <p className="text-muted-foreground">Controle suas despesas</p>
        </div>
        <MonthFilter />
      </div>

      <TransactionForm type="expense" categories={categories} action={createExpense as (formData: FormData) => Promise<{ error?: string; success?: boolean }>} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Total do período</CardTitle>
          <p className="text-xl font-bold text-red-500">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Nenhuma saída neste período</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: `${t.category.color}20` }}
                    >
                      <CategoryIcon icon={t.category.icon} className="text-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{t.category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.description || new Date(t.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-red-500">
                      R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <DeleteTransactionButton id={t.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
