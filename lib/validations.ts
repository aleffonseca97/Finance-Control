import { z } from 'zod'

export const transactionSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
  creditCardId: z.string().optional().nullable(),
})

export const investmentSchema = z.object({
  reserveCategoryId: z.string().min(1, 'Selecione uma reserva'),
  walletCategoryId: z.string().min(1, 'Selecione uma carteira'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})

export const withdrawalSchema = z.object({
  reserveCategoryId: z.string().min(1, 'Selecione a reserva de origem'),
  walletCategoryId: z.string().min(1, 'Selecione a carteira de origem'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})
