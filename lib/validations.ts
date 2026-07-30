import { z } from 'zod'
import ptBRMessages from '@/messages/pt-BR.json'

type ValidationMessages = typeof ptBRMessages.errors.validation

export type ValidationTranslator = (key: keyof ValidationMessages) => string

function legacyValidationT(key: keyof ValidationMessages): string {
  return ptBRMessages.errors.validation[key]
}

export function createTransactionSchema(t: ValidationTranslator) {
  return z.object({
    categoryId: z.string().min(1, t('selectCategory')),
    amount: z.coerce.number().positive(t('amountPositive')),
    description: z.string().optional(),
    date: z.string().min(1, t('dateRequired')),
    creditCardId: z.string().optional().nullable(),
  })
}

export function createInvestmentSchema(t: ValidationTranslator) {
  return z.object({
    reserveCategoryId: z.string().min(1, t('selectReserve')),
    walletCategoryId: z.string().min(1, t('selectWallet')),
    amount: z.coerce.number().positive(t('amountPositive')),
    date: z.string().min(1, t('dateRequired')),
    notes: z.string().optional(),
    useBalance: z.preprocess(
      (value) => {
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') return value === 'true'
        return true
      },
      z.boolean(),
    ),
  })
}

export function createWithdrawalSchema(t: ValidationTranslator) {
  return z.object({
    reserveCategoryId: z.string().min(1, t('selectOriginReserve')),
    walletCategoryId: z.string().min(1, t('selectOriginWallet')),
    amount: z.coerce.number().positive(t('amountPositive')),
    date: z.string().min(1, t('dateRequired')),
    notes: z.string().optional(),
  })
}

export function createRecurringPaymentCreateSchema(t: ValidationTranslator) {
  return z
    .object({
      categoryId: z.string().min(1, t('selectCategory')),
      amountType: z.enum(['fixed', 'percentage']).default('fixed'),
      amount: z.coerce.number().min(0, t('amountNonNegative')),
      percentage: z.coerce
        .number()
        .min(0, t('invalidPercentage'))
        .max(100, t('invalidPercentage'))
        .optional(),
      month: z.coerce.number().int().min(0).max(11),
      year: z.coerce.number().int().min(2000).max(2100),
    })
    .superRefine((data, ctx) => {
      if (data.amountType === 'fixed' && data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('amountPositive'),
          path: ['amount'],
        })
      }
      if (data.amountType === 'percentage') {
        if (data.percentage == null || data.percentage <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('percentageGreaterThanZero'),
            path: ['percentage'],
          })
        }
      }
    })
}

export function createRecurringInvestmentCreateSchema(t: ValidationTranslator) {
  return z
    .object({
      reserveCategoryId: z.string().min(1, t('selectReserve')),
      walletCategoryId: z.string().min(1, t('selectWallet')),
      amountType: z.enum(['fixed', 'percentage']).default('fixed'),
      amount: z.coerce.number().min(0, t('amountNonNegative')),
      percentage: z.coerce
        .number()
        .min(0, t('invalidPercentage'))
        .max(100, t('invalidPercentage'))
        .optional(),
      month: z.coerce.number().int().min(0).max(11),
      year: z.coerce.number().int().min(2000).max(2100),
    })
    .superRefine((data, ctx) => {
      if (data.amountType === 'fixed' && data.amount <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('amountPositive'),
          path: ['amount'],
        })
      }
      if (data.amountType === 'percentage') {
        if (data.percentage == null || data.percentage <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('percentageGreaterThanZero'),
            path: ['percentage'],
          })
        }
      }
    })
}

export function createGoalSchema(t: ValidationTranslator) {
  return z.object({
    name: z.string().trim().min(1, t('goalNameRequired')),
    reserveCategoryId: z.preprocess(
      (value) => {
        if (typeof value !== 'string') return null
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
      },
      z.string().nullable(),
    ),
    targetAmount: z.coerce.number().positive(t('targetAmountPositive')),
    deadline: z.preprocess(
      (value) => {
        if (typeof value !== 'string') return null
        const trimmed = value.trim()
        return trimmed.length > 0 ? trimmed : null
      },
      z.string().nullable(),
    ),
  })
}

export const INSTALLMENT_PLAN_KINDS = [
  'FINANCING_CAR',
  'FINANCING_HOME',
  'LOAN',
  'GENERAL',
  'CREDIT_CARD',
] as const

export type InstallmentPlanKind = (typeof INSTALLMENT_PLAN_KINDS)[number]

export const installmentPlanUpsertSchema = z
  .object({
    id: z.string().optional(),
    kind: z.enum(INSTALLMENT_PLAN_KINDS),
    name: z.string().trim().min(1, 'Informe um nome'),
    monthlyAmount: z.coerce.number().positive('Valor da parcela deve ser positivo'),
    totalInstallments: z.coerce.number().int().min(1, 'Informe o total de parcelas'),
    paidInstallments: z.coerce.number().int().min(0).default(0),
    firstInstallmentDate: z.string().min(1, 'Data da primeira parcela é obrigatória'),
    creditCardId: z.preprocess(
      (v) => (v == null || v === '' ? undefined : String(v)),
      z.string().min(1).optional(),
    ),
    notes: z.preprocess(
      (v) => (v == null || v === '' ? undefined : String(v).trim() || undefined),
      z.string().max(2000).optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.paidInstallments > data.totalInstallments) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Parcelas pagas não podem exceder o total contratado',
        path: ['paidInstallments'],
      })
    }
    if (data.kind === 'CREDIT_CARD' && !data.creditCardId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Selecione o cartão de crédito',
        path: ['creditCardId'],
      })
    }
  })

export const transactionSchema = createTransactionSchema(legacyValidationT)
export const investmentSchema = createInvestmentSchema(legacyValidationT)
export const withdrawalSchema = createWithdrawalSchema(legacyValidationT)
export const recurringPaymentCreateSchema =
  createRecurringPaymentCreateSchema(legacyValidationT)
export const recurringInvestmentCreateSchema =
  createRecurringInvestmentCreateSchema(legacyValidationT)
export const goalSchema = createGoalSchema(legacyValidationT)
