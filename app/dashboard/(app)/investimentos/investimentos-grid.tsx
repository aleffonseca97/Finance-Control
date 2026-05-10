'use client'

import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MonthStepper } from '@/components/forms/month-stepper'
import { InvestmentForm } from '@/components/forms/investment-form'
import { WithdrawalForm } from '@/components/forms/withdrawal-form'
import { MonthCalendar } from '@/components/shared/month-calendar'
import type { Category } from '@prisma/client'
import type { ReserveWalletBalance } from '@/app/actions/investments'

interface InvestimentosGridProps {
  monthLabel: string
  month: number
  year: number
  daysInMonth: number
  selectedDay: number
  daysWithEntries: number[]
  todayYear: number
  todayMonth: number
  todayDay: number
  reserveCategories: Category[]
  walletCategories: Category[]
  withdrawalBalances: ReserveWalletBalance[]
  createInvestment: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  createWithdrawal: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  calendarFallback: React.ReactNode
}

export function InvestimentosGrid({
  monthLabel,
  month,
  year,
  daysInMonth,
  selectedDay,
  daysWithEntries,
  todayYear,
  todayMonth,
  todayDay,
  reserveCategories,
  walletCategories,
  withdrawalBalances,
  createInvestment,
  createWithdrawal,
  calendarFallback,
}: InvestimentosGridProps) {
  const dateValue = `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:gap-8">
      <Card className="dashboard-bento-card-hero h-fit lg:sticky lg:top-24">
        <CardHeader className="space-y-1 pb-2 pt-5 sm:pt-6">
          <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
            Calendário de aportes
          </CardTitle>
          <CardDescription>
            {monthLabel}. Dias com movimentação aparecem marcados; selecione o dia
            dos formulários à direita.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 px-4 pb-4 pt-0 sm:px-6 sm:pb-6">
          <div className="w-full min-w-0">
            <MonthStepper />
          </div>
          <Suspense fallback={calendarFallback}>
            <MonthCalendar
              year={year}
              month={month}
              daysInMonth={daysInMonth}
              selectedDay={selectedDay}
              daysWithEntries={daysWithEntries}
              todayYear={todayYear}
              todayMonth={todayMonth}
              todayDay={todayDay}
              accentColor="blue"
              entryLabel="com aporte"
            />
          </Suspense>
        </CardContent>
      </Card>

      <div className="min-w-0 space-y-6">
        <Card className="dashboard-bento-card shadow-md">
          <CardHeader className="space-y-1.5 px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Novo aporte
            </CardTitle>
            <CardDescription>
              Escolha se o aporte usa saldo do mês ou é apenas monitorado (sem sair
              do caixa).
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <InvestmentForm
              reserveCategories={reserveCategories}
              walletCategories={walletCategories}
              action={createInvestment}
              dateValue={dateValue}
            />
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="space-y-1.5 px-4 pt-5 sm:px-6 sm:pt-6">
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Resgate para o caixa
            </CardTitle>
            <CardDescription>
              O valor retorna ao saldo mensal conforme a data e a carteira de
              origem.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
            <WithdrawalForm
              balances={withdrawalBalances}
              action={createWithdrawal}
              dateValue={dateValue}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
