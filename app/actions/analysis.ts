'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export type AnalysisRow = {
  label: string;
  income: number;
  fixedExpense: number;
  variableExpense: number;
  balance: number;
};

function computeBalanceRows(rows: Omit<AnalysisRow, 'balance'>[]): AnalysisRow[] {
  return rows.map((row) => ({
    ...row,
    balance: row.income - row.fixedExpense - row.variableExpense,
  }));
}

export async function getFixedVsVariable(month?: number, year?: number) {
  const session = await auth();
  if (!session?.user?.id) return { fixed: 0, variable: 0 };

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  const fixedCategories = await prisma.category.findMany({
    where: { userId: session.user.id, type: 'expense', isFixed: true },
    select: { id: true },
  });
  const variableCategories = await prisma.category.findMany({
    where: { userId: session.user.id, type: 'expense', isFixed: false },
    select: { id: true },
  });

  const fixedIds = fixedCategories.map((c) => c.id);
  const variableIds = variableCategories.map((c) => c.id);

  const [fixedAgg, variableAgg] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: 'expense',
        categoryId: { in: fixedIds },
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: {
        userId: session.user.id,
        type: 'expense',
        categoryId: { in: variableIds },
        date: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    fixed: fixedAgg._sum.amount ?? 0,
    variable: variableAgg._sum.amount ?? 0,
  };
}

export async function getExpensesByCategory(
  month?: number,
  year?: number,
  limit = 5,
) {
  const session = await auth();
  if (!session?.user?.id) return [];

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);

  const transactions = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId: session.user.id,
      type: 'expense',
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });

  const categoryIds = transactions.map((t) => t.categoryId);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return transactions
    .map((t) => ({
      name: categoryMap[t.categoryId]?.name ?? 'Outros',
      value: t._sum.amount ?? 0,
      color: categoryMap[t.categoryId]?.color ?? '#6366f1',
      icon: categoryMap[t.categoryId]?.icon ?? 'CreditCard',
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export async function getMonthComparison(month?: number, year?: number) {
  const session = await auth();
  if (!session?.user?.id)
    return {
      current: { income: 0, expense: 0 },
      previous: { income: 0, expense: 0 },
    };

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();

  const currentStart = new Date(y, m, 1);
  const currentEnd = new Date(y, m + 1, 0);
  const prevStart = new Date(y, m - 1, 1);
  const prevEnd = new Date(y, m, 0);

  const [currentIncome, currentExpense, prevIncome, prevExpense] = await Promise.all(
    [
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: 'income',
          date: { gte: currentStart, lte: currentEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: 'expense',
          date: { gte: currentStart, lte: currentEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: 'income',
          date: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId: session.user.id,
          type: 'expense',
          date: { gte: prevStart, lte: prevEnd },
        },
        _sum: { amount: true },
      }),
    ],
  );

  return {
    current: {
      income: currentIncome._sum.amount ?? 0,
      expense: currentExpense._sum.amount ?? 0,
    },
    previous: {
      income: prevIncome._sum.amount ?? 0,
      expense: prevExpense._sum.amount ?? 0,
    },
  };
}

export async function getDailyAnalysis(
  month?: number,
  year?: number,
): Promise<AnalysisRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const rows: Omit<AnalysisRow, 'balance'>[] = Array.from(
    { length: daysInMonth },
    (_, index) => ({
      label: String(index + 1),
      income: 0,
      fixedExpense: 0,
      variableExpense: 0,
    }),
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
      type: { in: ['income', 'expense'] },
    },
    select: {
      type: true,
      amount: true,
      date: true,
      category: { select: { isFixed: true } },
    },
  });

  for (const transaction of transactions) {
    const index = transaction.date.getDate() - 1;
    if (index < 0 || index >= rows.length) continue;

    if (transaction.type === 'income') {
      rows[index].income += transaction.amount;
      continue;
    }

    if (transaction.category?.isFixed) {
      rows[index].fixedExpense += transaction.amount;
    } else {
      rows[index].variableExpense += transaction.amount;
    }
  }

  return computeBalanceRows(rows);
}

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

export async function getMonthlyAnalysis(year?: number): Promise<AnalysisRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const now = new Date();
  const y = year ?? now.getFullYear();
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);

  const rows: Omit<AnalysisRow, 'balance'>[] = MONTH_LABELS.map((monthLabel) => ({
    label: monthLabel,
    income: 0,
    fixedExpense: 0,
    variableExpense: 0,
  }));

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
      type: { in: ['income', 'expense'] },
    },
    select: {
      type: true,
      amount: true,
      date: true,
      category: { select: { isFixed: true } },
    },
  });

  for (const transaction of transactions) {
    const monthIndex = transaction.date.getMonth();
    if (monthIndex < 0 || monthIndex > 11) continue;

    if (transaction.type === 'income') {
      rows[monthIndex].income += transaction.amount;
      continue;
    }

    if (transaction.category?.isFixed) {
      rows[monthIndex].fixedExpense += transaction.amount;
    } else {
      rows[monthIndex].variableExpense += transaction.amount;
    }
  }

  return computeBalanceRows(rows);
}

export async function getAnnualAnalysis(yearsBack = 5): Promise<AnalysisRow[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const startYear = currentYear - Math.max(1, yearsBack) + 1;
  const start = new Date(startYear, 0, 1);
  const end = new Date(currentYear, 11, 31, 23, 59, 59, 999);

  const rowsByYear = new Map<number, Omit<AnalysisRow, 'balance'>>();
  for (let y = startYear; y <= currentYear; y++) {
    rowsByYear.set(y, {
      label: String(y),
      income: 0,
      fixedExpense: 0,
      variableExpense: 0,
    });
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      date: { gte: start, lte: end },
      type: { in: ['income', 'expense'] },
    },
    select: {
      type: true,
      amount: true,
      date: true,
      category: { select: { isFixed: true } },
    },
  });

  for (const transaction of transactions) {
    const yearKey = transaction.date.getFullYear();
    const row = rowsByYear.get(yearKey);
    if (!row) continue;

    if (transaction.type === 'income') {
      row.income += transaction.amount;
      continue;
    }

    if (transaction.category?.isFixed) {
      row.fixedExpense += transaction.amount;
    } else {
      row.variableExpense += transaction.amount;
    }
  }

  return computeBalanceRows(Array.from(rowsByYear.values()));
}
