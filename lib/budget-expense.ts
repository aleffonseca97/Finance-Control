import type { Prisma } from '@prisma/client'

/**
 * Compras no cartão não entram no orçamento até a fatura fechar.
 * Pagamentos de fatura reduzem o saldo mensal (saída de caixa).
 */
export const budgetExpenseWhere: Pick<
  Prisma.TransactionWhereInput,
  'type' | 'creditCardId'
> = {
  type: 'expense',
  creditCardId: null,
}
