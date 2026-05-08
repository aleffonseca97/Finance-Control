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
  useBalance: z.preprocess(
    (value) => {
      if (typeof value === 'boolean') return value
      if (typeof value === 'string') return value === 'true'
      return true
    },
    z.boolean()
  ),
})

export const withdrawalSchema = z.object({
  reserveCategoryId: z.string().min(1, 'Selecione a reserva de origem'),
  walletCategoryId: z.string().min(1, 'Selecione a carteira de origem'),
  amount: z.coerce.number().positive('Valor deve ser positivo'),
  date: z.string().min(1, 'Data é obrigatória'),
  notes: z.string().optional(),
})

export const recurringPaymentCreateSchema = z.object({
  categoryId: z.string().min(1, 'Selecione uma categoria'),
  amountType: z.enum(['fixed', 'percentage']).default('fixed'),
  amount: z.coerce.number().min(0, 'Valor deve ser maior ou igual a zero'),
  percentage: z.coerce.number().min(0, 'Percentual inválido').max(100, 'Percentual inválido').optional(),
  month: z.coerce.number().int().min(0).max(11),
  year: z.coerce.number().int().min(2000).max(2100),
}).superRefine((data, ctx) => {
  if (data.amountType === 'fixed' && data.amount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Valor deve ser positivo',
      path: ['amount'],
    })
  }
  if (data.amountType === 'percentage') {
    if (data.percentage == null || data.percentage <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um percentual maior que zero',
        path: ['percentage'],
      })
    }
  }
})

export const recurringInvestmentCreateSchema = z.object({
  reserveCategoryId: z.string().min(1, 'Selecione uma reserva'),
  walletCategoryId: z.string().min(1, 'Selecione uma carteira'),
  amountType: z.enum(['fixed', 'percentage']).default('fixed'),
  amount: z.coerce.number().min(0, 'Valor deve ser maior ou igual a zero'),
  percentage: z.coerce.number().min(0, 'Percentual inválido').max(100, 'Percentual inválido').optional(),
  month: z.coerce.number().int().min(0).max(11),
  year: z.coerce.number().int().min(2000).max(2100),
}).superRefine((data, ctx) => {
  if (data.amountType === 'fixed' && data.amount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Valor deve ser positivo',
      path: ['amount'],
    })
  }
  if (data.amountType === 'percentage') {
    if (data.percentage == null || data.percentage <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe um percentual maior que zero',
        path: ['percentage'],
      })
    }
  }
})

export const goalSchema = z.object({
  name: z.string().trim().min(1, 'Nome da meta é obrigatório'),
  reserveCategoryId: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    },
    z.string().nullable()
  ),
  targetAmount: z.coerce.number().positive('Valor alvo deve ser maior que zero'),
  deadline: z.preprocess(
    (value) => {
      if (typeof value !== 'string') return null
      const trimmed = value.trim()
      return trimmed.length > 0 ? trimmed : null
    },
    z.string().nullable()
  ),
})
