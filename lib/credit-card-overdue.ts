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
): SerializedCreditCardOverdue[] {
  return notices.map((n) => ({
    cardId: n.cardId,
    cardName: n.cardName,
    lastFour: n.lastFour,
    color: n.color,
    unpaid: n.unpaid,
    dueDateLabel: n.dueDate.toLocaleDateString('pt-BR'),
    closingLabel: n.closingLabel,
  }))
}
