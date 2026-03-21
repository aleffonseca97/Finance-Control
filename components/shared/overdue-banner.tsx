import { AlertTriangle } from 'lucide-react'
import type { SerializedCreditCardOverdue } from '@/app/actions/credit-cards'
import { formatBRL } from '@/lib/date-utils'

type Props = {
  notices: SerializedCreditCardOverdue[]
}

export function OverdueBanner({ notices }: Props) {
  if (notices.length === 0) return null

  return (
    <div
      role="status"
      className="flex gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm"
    >
      <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
      <div className="space-y-1">
        <p className="font-semibold text-destructive">
          Fatura do cartão em atraso
        </p>
        <ul className="list-disc pl-4 text-muted-foreground space-y-0.5">
          {notices.map((n) => (
            <li key={`${n.cardId}-${n.closingLabel}`}>
              <span className="text-foreground font-medium">{n.cardName}</span>
              {n.lastFour ? ` •••• ${n.lastFour}` : ''}: R${' '}
              {formatBRL(n.unpaid)} (venc. {n.dueDateLabel}, fech.{' '}
              {n.closingLabel})
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
