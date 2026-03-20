import type { Transaction, Category } from '@prisma/client'

export type TransactionWithCategory = Transaction & {
  category: Category
}
