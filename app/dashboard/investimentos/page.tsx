import { Suspense } from 'react';
import { getReserveCategories, getWalletCategories } from '@/app/actions/categories';
import {
  getInvestments,
  getInvestmentsSummary,
  createInvestment,
  createWithdrawal,
  getReserveWalletBalancesForUser,
} from '@/app/actions/investments';
import { DeleteInvestmentButton } from '@/components/forms/delete-investment-button';
import { CategoryIcon } from '@/components/category/category-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentsPieChart } from '@/components/charts/investments-pie-chart';
import { InvestimentosGrid } from './investimentos-grid';

function CalendarFallback() {
  return (
    <div
      className="h-[280px] w-full animate-pulse rounded-lg bg-muted/60 sm:h-[300px]"
      aria-hidden
    />
  );
}

export default async function InvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;
  const dayParam = params.day ? parseInt(params.day, 10) : undefined;

  const [
    reserveCategories,
    walletCategories,
    { investments, total },
    investmentsSummary,
    withdrawalBalances,
  ] = await Promise.all([
    getReserveCategories(),
    getWalletCategories(),
    getInvestments(month, year),
    getInvestmentsSummary(),
    getReserveWalletBalancesForUser(),
  ]);

  const investmentsByDay: Record<number, typeof investments> = {};
  investments.forEach((inv) => {
    const isoDate = new Date(inv.date).toISOString();
    const d = parseInt(isoDate.slice(8, 10), 10);
    if (!investmentsByDay[d]) investmentsByDay[d] = [];
    investmentsByDay[d].push(inv);
  });

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = new Date(y, m, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  });
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const defaultDay =
    now.getFullYear() === y && now.getMonth() === m ? now.getDate() : 1;
  const selectedDay =
    dayParam !== undefined &&
    !Number.isNaN(dayParam) &&
    dayParam >= 1 &&
    dayParam <= daysInMonth
      ? dayParam
      : defaultDay;

  const daysWithEntries = Object.keys(investmentsByDay).map(Number);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-2 sm:py-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Investimentos
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Acompanhe seus aportes
        </p>
      </header>

      <div className="min-w-0">
        <InvestimentosGrid
          monthLabel={`${monthTitle} de ${y}`}
          month={m}
          year={y}
          daysInMonth={daysInMonth}
          selectedDay={selectedDay}
          daysWithEntries={daysWithEntries}
          todayYear={now.getFullYear()}
          todayMonth={now.getMonth()}
          todayDay={now.getDate()}
          reserveCategories={reserveCategories}
          walletCategories={walletCategories}
          withdrawalBalances={withdrawalBalances}
          createInvestment={
            createInvestment as (
              formData: FormData,
            ) => Promise<{ error?: string; success?: boolean }>
          }
          createWithdrawal={
            createWithdrawal as (
              formData: FormData,
            ) => Promise<{ error?: string; success?: boolean }>
          }
          calendarFallback={<CalendarFallback />}
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle className="text-base sm:text-lg">Total do período</CardTitle>
          <p className="text-xl font-bold text-blue-500 tabular-nums sm:text-2xl">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {investments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              Nenhum aporte ou saque neste período
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {investments.map((inv) => {
                const displayCategory = inv.reserveCategory && inv.walletCategory
                  ? { ...inv.reserveCategory, name: `${inv.reserveCategory.name} → ${inv.walletCategory.name}` }
                  : inv.category;
                const isWithdrawal = inv.amount < 0;
                return (
                  <li
                    key={inv.id}
                    className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 hover:bg-muted/50"
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className="shrink-0 rounded-full p-2"
                        style={{
                          backgroundColor: `${(displayCategory?.color ?? '#6366f1')}20`,
                        }}
                      >
                        <CategoryIcon
                          icon={displayCategory?.icon ?? 'CircleDollarSign'}
                          className="text-foreground"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">
                          {displayCategory?.name ?? 'Investimento'}
                          {isWithdrawal && ' (saque)'}
                        </p>
                        <p className="break-words text-sm text-muted-foreground">
                          {new Date(inv.date).toLocaleDateString('pt-BR')}
                          {inv.notes && ` • ${inv.notes}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                      <span
                        className={`font-semibold tabular-nums ${isWithdrawal ? 'text-green-600' : 'text-blue-500'}`}
                      >
                        {isWithdrawal ? '+' : ''}R${' '}
                        {Math.abs(inv.amount).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                        })}
                        {isWithdrawal && ' (saldo)'}
                      </span>
                      <DeleteInvestmentButton id={inv.id} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle className="text-base sm:text-lg">Total geral investido</CardTitle>
          <p className="text-xl font-bold text-blue-500 tabular-nums sm:text-2xl">
            R${' '}
            {investmentsSummary.total.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
            })}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {investmentsSummary.items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              Você ainda não possui investimentos cadastrados
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] items-start">
              <ul className="min-w-0 space-y-2">
                {investmentsSummary.items.map((item) => (
                  <li
                    key={item.label ?? item.category.id}
                    className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div
                        className="shrink-0 rounded-full p-2"
                        style={{
                          backgroundColor: `${item.category.color ?? '#3b82f6'}20`,
                        }}
                      >
                        <CategoryIcon
                          icon={item.category.icon}
                          className="text-foreground"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium">{item.label ?? item.category.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.label ? 'Reserva → Carteira' : 'Total investido na categoria'}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-blue-500">
                      R${' '}
                      {item.total.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="min-w-0 rounded-lg border p-3 sm:p-4">
                <InvestmentsPieChart
                  data={investmentsSummary.items.map((item) => ({
                    name: item.label ?? item.category.name,
                    value: item.total,
                    color: item.category.color,
                  }))}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
