import type { AppLocale } from '@/i18n/routing'
import { formatDate } from '@/lib/i18n/format'

export type CreditCardOverdueNotice = {
  cardId: string
  cardName: string
  lastFour: string | null
  color: string | null
  unpaid: number
  dueDate: Date
  closingLabel: string
}

export type SerializedCreditCardOverdue = {
  cardId: string
  cardName: string
  lastFour: string | null
  color: string | null
  unpaid: number
  dueDateLabel: string
  closingLabel: string
}

export function serializeOverdueNotices(
  notices: CreditCardOverdueNotice[],
  locale: AppLocale = 'pt-BR',
): SerializedCreditCardOverdue[] {
  return notices.map((n) => ({
    cardId: n.cardId,
    cardName: n.cardName,
    lastFour: n.lastFour,
    color: n.color,
    unpaid: n.unpaid,
    dueDateLabel: formatDate(n.dueDate, locale),
    closingLabel: n.closingLabel,
  }))
}
