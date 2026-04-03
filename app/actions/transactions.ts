'use server';

import type { Prisma } from '@prisma/client';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { transactionSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { budgetExpenseWhere } from '@/lib/budget-expense';
import { roundMoney } from '@/lib/credit-card-billing';

export async function createTransaction(
  type: 'income' | 'expense',
  formData: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Não autorizado' };

  const creditCardIdRaw = formData.get('creditCardId');
  const parsed = transactionSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amount: formData.get('amount'),
    description: formData.get('description'),
    date: formData.get('date'),
    creditCardId:
      creditCardIdRaw && String(creditCardIdRaw).trim() ? creditCardIdRaw : null,
  });

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const category = await prisma.category.findFirst({
    where: { id: parsed.data.categoryId, userId: session.user.id, type },
  });

  if (!category) return { error: 'Categoria inválida' };

  const creditCardId =
    type === 'expense' && parsed.data.creditCardId ? parsed.data.creditCardId : null;

  if (creditCardId) {
    const card = await prisma.creditCard.findFirst({
      where: { id: creditCardId, userId: session.user.id },
    });
    if (!card) return { error: 'Cartão de crédito inválido' };
    if (card.limit + 1e-6 < parsed.data.amount)
      return { error: 'Limite disponível insuficiente' };
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId: session.user.id,
        categoryId: parsed.data.categoryId,
        amount: parsed.data.amount,
        description: parsed.data.description || null,
        date: new Date(parsed.data.date),
        type,
        creditCardId,
      },
    });

    if (creditCardId) {
      const card = await tx.creditCard.findUnique({
        where: { id: creditCardId },
      });
      if (card) {
        await tx.creditCard.update({
          where: { id: creditCardId },
          data: {
            limit: Math.max(
              0,
              roundMoney(card.limit - parsed.data.amount),
            ),
          },
        });
      }
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/entradas');
  revalidatePath('/dashboard/saidas');
  revalidatePath('/dashboard/analise');
  revalidatePath('/dashboard/cartao-credito');
  return { success: true };
}

export async function createIncome(formData: FormData) {
  return createTransaction('income', formData);
}

export async function createExpense(formData: FormData) {
  return createTransaction('expense', formData);
}

export async function updateTransaction(
  id: string,
  data: { categoryId?: string; amount?: number; description?: string | null },
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Não autorizado' };

  const tx = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, type: true },
  });
  if (!tx) return { error: 'Transação não encontrada' };

  if (!['income', 'expense'].includes(tx.type)) {
    return { error: 'Tipo de transação inválido' };
  }

  if (data.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        userId: session.user.id,
        type: tx.type,
      },
    });
    if (!category) return { error: 'Categoria inválida' };
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      ...(data.categoryId != null && { categoryId: data.categoryId }),
      ...(data.amount != null && { amount: data.amount }),
      ...(data.description !== undefined && {
        description: data.description || null,
      }),
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/entradas');
  revalidatePath('/dashboard/saidas');
  revalidatePath('/dashboard/analise');
  return { success: true };
}

export async function updateTransactionDescription(
  id: string,
  description: string | null,
) {
  return updateTransaction(id, { description });
}

export async function deleteTransaction(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Não autorizado' };

  const tx = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
    select: { amount: true, creditCardId: true, paysCreditCardId: true },
  });

  if (!tx) return { error: 'Transação não encontrada' };

  await prisma.$transaction(async (db) => {
    await db.transaction.deleteMany({
      where: { id, userId: session.user.id },
    });
    if (tx.creditCardId) {
      const card = await db.creditCard.findUnique({
        where: { id: tx.creditCardId },
      });
      if (card) {
        await db.creditCard.update({
          where: { id: tx.creditCardId },
          data: {
            limit: Math.min(
              card.totalLimit,
              roundMoney(card.limit + tx.amount),
            ),
          },
        });
      }
    }
    if (tx.paysCreditCardId) {
      const card = await db.creditCard.findUnique({
        where: { id: tx.paysCreditCardId },
      });
      if (card) {
        await db.creditCard.update({
          where: { id: tx.paysCreditCardId },
          data: {
            limit: Math.max(
              0,
              roundMoney(card.limit - tx.amount),
            ),
          },
        });
      }
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/entradas');
  revalidatePath('/dashboard/saidas');
  revalidatePath('/dashboard/analise');
  revalidatePath('/dashboard/cartao-credito');
  return { success: true };
}

export async function ensureFixedExpensesForMonth(
  userId: string,
  month: number,
  year: number,
) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const fixedCategories = await prisma.category.findMany({
    where: {
      userId,
      type: 'expense',
      isFixed: true,
      defaultValue: { not: null },
    },
  });

  const existing = await prisma.transaction.findMany({
    where: {
      userId,
      type: 'expense',
      date: { gte: start, lte: end },
    },
    select: { categoryId: true },
  });
  const existingCategoryIds = new Set(existing.map((t) => t.categoryId));

  const toCreate = fixedCategories.filter(
    (c) => c.defaultValue != null && !existingCategoryIds.has(c.id),
  );

  if (toCreate.length > 0) {
    await prisma.transaction.createMany({
      data: toCreate.map((cat) => ({
        userId,
        categoryId: cat.id,
        amount: cat.defaultValue!,
        description: 'Lançamento automático',
        date: start,
        type: 'expense',
      })),
    });
  }
}

export type TransactionWithRelations = Prisma.TransactionGetPayload<{
  include: { category: true; creditCard: true; paysCreditCard: true };
}>;

export async function getTransactions(
  type: 'income' | 'expense',
  month?: number,
  year?: number,
): Promise<{ transactions: TransactionWithRelations[]; total: number }> {
  const session = await auth();
  if (!session?.user?.id) return { transactions: [], total: 0 };

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  if (type === 'expense') {
    await ensureFixedExpensesForMonth(session.user.id, m, y);
  }

  const [transactions, agg] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: session.user.id, type, date: { gte: start, lte: end } },
      include: { category: true, creditCard: true, paysCreditCard: true },
      orderBy: { date: 'desc' },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        date: { gte: start, lte: end },
        ...(type === 'expense' ? budgetExpenseWhere : { type: 'income' }),
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    transactions,
    total: agg._sum.amount ?? 0,
  };
}
