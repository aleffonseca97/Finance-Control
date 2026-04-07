'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { formatBRL, formatDateBR } from '@/lib/date-utils'
import type { TransactionWithCategory } from '@/lib/transaction-types'
import {
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'

type SummaryItem = {
  title: string
  value: number
  iconName: 'wallet' | 'credit-card' | 'trending-up' | 'trending-down' | 'piggy-bank'
  color: string
  footnote?: string
  action?: 'statement' | 'credit-card' | 'incomes' | 'expenses' | 'investments'
}

type Props = {
  items: SummaryItem[]
  statementTransactions: TransactionWithCategory[]
}

const actionRouteMap = {
  'credit-card': '/dashboard/cartao-credito',
  incomes: '/dashboard/entradas',
  expenses: '/dashboard/saidas',
  investments: '/dashboard/investimentos',
} as const

const iconMap = {
  wallet: Wallet,
  'credit-card': CreditCard,
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'piggy-bank': PiggyBank,
} as const

export function SummaryCards({ items, statementTransactions }: Props) {
  const router = useRouter()
  const [isStatementOpen, setIsStatementOpen] = useState(false)
  const [statementDaysFilter, setStatementDaysFilter] = useState<15 | 30 | 60 | 90>(30)

  const handleCardClick = (action?: SummaryItem['action']) => {
    if (!action) return
    if (action === 'statement') {
      setIsStatementOpen(true)
      return
    }
    router.push(actionRouteMap[action])
  }

  const filteredStatementTransactions = useMemo(() => {
    const now = Date.now()
    const periodMs = statementDaysFilter * 24 * 60 * 60 * 1000
    return statementTransactions.filter((transaction) => {
      const transactionMs = new Date(transaction.date).getTime()
      return now - transactionMs <= periodMs
    })
  }, [statementDaysFilter, statementTransactions])

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {items.map((item, index) => {
          const Icon = iconMap[item.iconName]
          const isHero = index === 0
          const isClickable = Boolean(item.action)
          return (
            <Card
              key={item.title}
              onClick={() => handleCardClick(item.action)}
              className={
                (isHero
                  ? 'dashboard-bento-card-hero border-primary/30 shadow-md'
                  : 'dashboard-bento-card-muted') +
                (isClickable
                  ? ' cursor-pointer transition-transform hover:-translate-y-0.5'
                  : '')
              }
              role={isClickable ? 'button' : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={
                isClickable
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        handleCardClick(item.action)
                      }
                    }
                  : undefined
              }
            >
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium leading-snug">{item.title}</CardTitle>
                <Icon className={`h-5 w-5 shrink-0 ${item.color}`} aria-hidden />
              </CardHeader>
              <CardContent>
                <p className={`text-xl font-bold tabular-nums sm:text-2xl ${item.color}`}>
                  R$ {formatBRL(item.value)}
                </p>
                {item.footnote && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.footnote}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog
        open={isStatementOpen}
        onOpenChange={setIsStatementOpen}
        className="max-w-2xl p-0"
        aria-label="Extrato do mês"
      >
        <div className="p-4 sm:p-6">
          <DialogHeader onClose={() => setIsStatementOpen(false)}>
            Extrato do mês
          </DialogHeader>
          <div className="mb-3 flex flex-wrap gap-2">
            {[15, 30, 60, 90].map((days) => {
              const isActive = statementDaysFilter === days
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setStatementDaysFilter(days as 15 | 30 | 60 | 90)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground hover:bg-muted'
                  }`}
                >
                  {days} dias
                </button>
              )
            })}
          </div>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filteredStatementTransactions.length === 0 && (
              <p className="rounded-md border p-3 text-sm text-muted-foreground">
                Nenhuma transação encontrada neste período.
              </p>
            )}
            {filteredStatementTransactions.map((transaction) => {
              const isIncome = transaction.type === 'income'
              return (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {transaction.description || transaction.category.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {transaction.category.name} - {formatDateBR(transaction.date)}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-sm font-semibold tabular-nums ${
                      isIncome ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {isIncome ? '+' : '-'} R$ {formatBRL(transaction.amount)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </Dialog>
    </>
  )
}
