import type { Prisma } from '@prisma/client'

/**
 * Despesas de caixa: compras no cartão (creditCardId preenchido) ficam fora.
 * Pagamentos de fatura (paysCreditCardId) contam como saída de caixa.
 */
export const budgetExpenseWhere: Pick<
  Prisma.TransactionWhereInput,
  'type' | 'creditCardId'
> = {
  type: 'expense',
  creditCardId: null,
}
