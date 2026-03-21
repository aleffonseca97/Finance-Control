'use client'

import Link from 'next/link'
import { TransactionForm } from '@/components/forms/transaction-form'
import { DateBanner } from '@/components/shared/date-banner'
import { buttonVariants } from '@/components/ui/button'
import { buildDateValue } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import type { Category } from '@prisma/client'

type CreditCard = {
  id: string
  name: string
  lastFour: string | null
  limit: number
  color: string | null
}

type Props = {
  type: 'income' | 'expense'
  categories: Category[]
  creditCards?: CreditCard[]
  selectedDay: number
  month: number
  year: number
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  emptyCategoryMessage: string
}

const FORM_CLASSES = cn(
  'rounded-none border-0 bg-transparent p-0 shadow-none',
  'space-y-5',
  '[&_input:not([type=hidden])]:min-h-11 [&_input:not([type=hidden])]:text-base sm:[&_input:not([type=hidden])]:min-h-10 sm:[&_input:not([type=hidden])]:text-sm',
  '[&_select]:min-h-11 [&_select]:text-base sm:[&_select]:min-h-10 sm:[&_select]:text-sm',
)

const STYLE = {
  income: {
    colorClass: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    iconColorClass: 'text-emerald-600 dark:text-emerald-400',
    sectionId: 'entradas-lancamento-title',
    sectionLabel: 'Formulário de nova entrada na data selecionada no calendário',
  },
  expense: {
    colorClass: 'border-red-500/25 bg-red-500/[0.06]',
    iconColorClass: 'text-red-600 dark:text-red-400',
    sectionId: 'saidas-lancamento-title',
    sectionLabel: 'Formulário de nova saída na data selecionada no calendário',
  },
} as const

export function TransactionEntryForm({
  type,
  categories,
  creditCards,
  selectedDay,
  month,
  year,
  action,
  emptyCategoryMessage,
}: Props) {
  const dateValue = buildDateValue(year, month, selectedDay)
  const style = STYLE[type]

  if (categories.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/25 px-4 py-8 text-center sm:px-8"
      >
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
          {emptyCategoryMessage}
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
    )
  }

  return (
    <section aria-labelledby={style.sectionId} className="space-y-5">
      <h2 id={style.sectionId} className="sr-only">
        {style.sectionLabel}
      </h2>

      <DateBanner
        year={year}
        month={month}
        selectedDay={selectedDay}
        colorClass={style.colorClass}
        iconColorClass={style.iconColorClass}
      />

      <TransactionForm
        type={type}
        categories={categories}
        creditCards={creditCards}
        action={action}
        dateValue={dateValue}
        className={FORM_CLASSES}
      />
    </section>
  )
}
