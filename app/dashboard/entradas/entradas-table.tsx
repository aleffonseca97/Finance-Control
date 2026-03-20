'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { TransactionForm } from '@/components/forms/transaction-form';
import { createIncome } from '@/app/actions/transactions';
import { buttonVariants } from '@/components/ui/button';
import type { Category } from '@prisma/client';
import { cn } from '@/lib/utils';

type Props = {
  categories: Category[];
  selectedDay: number;
  month: number;
  year: number;
};

export function EntradasTable({ categories, selectedDay, month, year }: Props) {
  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`;

  const dateLabelLong = useMemo(
    () =>
      new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    [year, month, selectedDay],
  );

  const dateLabelShort = useMemo(
    () =>
      new Date(year, month, selectedDay).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    [year, month, selectedDay],
  );

  if (categories.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/25 px-4 py-8 text-center sm:px-8"
      >
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          Não há categorias de receita. Cadastre ao menos uma em Configurações para
          lançar entradas.
        </p>
        <Link
          href="/dashboard/configuracoes/categorias"
          className={cn(
            buttonVariants({ variant: 'default' }),
            'mt-5 inline-flex min-h-11 w-full max-w-xs touch-manipulation sm:w-auto',
          )}
        >
          Ir para categorias
        </Link>
      </div>
    );
  }

  return (
    <section aria-labelledby="entradas-lancamento-title" className="space-y-5">
      <h2 id="entradas-lancamento-title" className="sr-only">
        Formulário de nova entrada na data selecionada no calendário
      </h2>

      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] px-3 py-3 sm:items-center sm:gap-4 sm:px-4 sm:py-3.5">
        <CalendarDays
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 sm:mt-0 sm:h-5 sm:w-5"
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">
            Data do lançamento
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-base">
            <time dateTime={dateValue} className="block tabular-nums">
              <span className="sm:hidden">{dateLabelShort}</span>
              <span className="hidden sm:inline">{dateLabelLong}</span>
            </time>
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Altere o dia no calendário ao lado para mudar esta data.
          </p>
        </div>
      </div>

      <TransactionForm
        type="income"
        categories={categories}
        action={createIncome}
        dateValue={dateValue}
        className={cn(
          'rounded-none border-0 bg-transparent p-0 shadow-none',
          'space-y-5',
          '[&_input:not([type=hidden])]:min-h-11 [&_input:not([type=hidden])]:text-base sm:[&_input:not([type=hidden])]:min-h-10 sm:[&_input:not([type=hidden])]:text-sm',
          '[&_select]:min-h-11 [&_select]:text-base sm:[&_select]:min-h-10 sm:[&_select]:text-sm',
        )}
      />
    </section>
  );
}
