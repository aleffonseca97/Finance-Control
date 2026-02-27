import { z } from 'zod'

export const transactionSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  description: z.string().optional(),
  date: z.string().min(1, 'Data é obrigatória'),
})

export const investmentSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})
