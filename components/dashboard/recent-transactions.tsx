import Link from 'next/link'
import { CategoryIcon } from '@/components/category/category-icon'
import type { Transaction } from '@prisma/client'
import type { Category } from '@prisma/client'

interface TransactionWithCategory extends Transaction {
  category: Category
}

export function RecentTransactions({ transactions }: { transactions: TransactionWithCategory[] }) {
  if (transactions.length === 0) {
    return (
      <p className="text-muted-foreground text-sm py-4">
        Nenhuma transação recente
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.slice(0, 5).map((t) => (
        <Link
          key={t.id}
          href={t.type === 'income' ? '/dashboard/entradas' : '/dashboard/saidas'}
          className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div
              className="rounded-full p-1.5"
              style={{ backgroundColor: `${t.category.color}20` }}
            >
              <CategoryIcon icon={t.category.icon} size={16} />
            </div>
            <div>
              <p className="text-sm font-medium">{t.category.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(t.date).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
          <span
            className={`text-sm font-medium ${
              t.type === 'income' ? 'text-emerald-500' : 'text-red-500'
            }`}
          >
            {t.type === 'income' ? '+' : '-'} R${' '}
            {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </Link>
      ))}
    </div>
  )
}
