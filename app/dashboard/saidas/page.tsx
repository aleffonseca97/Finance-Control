import { Suspense } from 'react';
import { getCategoriesByType } from '@/app/actions/categories';
import { getCreditCards } from '@/app/actions/credit-cards';
import { getTransactions } from '@/app/actions/transactions';
import { MonthStepper } from '@/components/forms/month-stepper';
import { DeleteTransactionButton } from '@/components/forms/delete-transaction-button';
import { CategoryIcon } from '@/components/category/category-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EntradasCalendar } from '../entradas/entradas-calendar';
import { SaidasGrid } from './saidas-grid';

function CalendarFallback() {
  return (
    <div
      className="h-[280px] w-full animate-pulse rounded-lg bg-muted/60 sm:h-[300px]"
      aria-hidden
    />
  );
}

export default async function SaidasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; day?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;
  const dayParam = params.day ? parseInt(params.day, 10) : undefined;

  const [categories, creditCards, { transactions, total }] = await Promise.all([
    getCategoriesByType('expense'),
    getCreditCards(),
    getTransactions('expense', month, year),
  ]);

  const transactionsByDay: Record<number, typeof transactions> = {};
  transactions.forEach((t) => {
    const isoDate = new Date(t.date).toISOString();
    const d = parseInt(isoDate.slice(8, 10), 10);
    if (!transactionsByDay[d]) transactionsByDay[d] = [];
    transactionsByDay[d].push(t);
  });

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const daysInMonth = new Date(y, m + 1, 0).getDate();

  const defaultDay =
    now.getFullYear() === y && now.getMonth() === m ? now.getDate() : 1;
  const selectedDay =
    dayParam !== undefined &&
    !Number.isNaN(dayParam) &&
    dayParam >= 1 &&
    dayParam <= daysInMonth
      ? dayParam
      : defaultDay;

  const monthLabel = new Date(y, m, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  });
  const monthTitle = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);

  const daysWithEntries = Object.keys(transactionsByDay).map(Number);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 py-2 sm:py-0">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Saídas</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Controle suas despesas
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr] xl:gap-8">
        <Card className="border-primary/40 bg-primary/5 h-fit lg:sticky lg:top-24">
          <CardContent className="flex flex-col gap-4 py-4 sm:py-5">
            <div>
              <p className="text-xs font-medium uppercase text-primary/70 tracking-wide">
                Mês em edição
              </p>
              <p className="text-lg font-semibold">
                {monthTitle} de {y}
              </p>
            </div>
            <div className="w-full min-w-0">
              <MonthStepper />
            </div>
            <Suspense fallback={<CalendarFallback />}>
              <EntradasCalendar
                year={y}
                month={m}
                daysInMonth={daysInMonth}
                selectedDay={selectedDay}
                daysWithEntries={daysWithEntries}
                todayYear={now.getFullYear()}
                todayMonth={now.getMonth()}
                todayDay={now.getDate()}
              />
            </Suspense>
          </CardContent>
        </Card>

        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardContent className="px-4 pb-4 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
            <SaidasGrid
              categories={categories}
              creditCards={creditCards}
              selectedDay={selectedDay}
              month={m}
              year={y}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <CardTitle className="text-base sm:text-lg">Total do período</CardTitle>
          <p className="text-xl font-bold text-red-500 tabular-nums sm:text-2xl">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8 text-sm sm:text-base">
              Nenhuma saída neste período
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {transactions.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 hover:bg-muted/50"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="shrink-0 rounded-full p-2"
                      style={{ backgroundColor: `${t.category.color}20` }}
                    >
                      <CategoryIcon
                        icon={t.category.icon}
                        className="text-foreground"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">{t.category.name}</p>
                      <p className="text-sm text-muted-foreground break-words">
                        {t.description ||
                          new Date(t.date)
                            .toISOString()
                            .slice(0, 10)
                            .split('-')
                            .reverse()
                            .join('/')}
                        {t.creditCard && (
                          <span className="text-amber-600 dark:text-amber-500">
                            {' '}
                            • Cartão: {t.creditCard.name}
                            {t.creditCard.lastFour ? ` •••• ${t.creditCard.lastFour}` : ''}
                          </span>
                        )}
                        {t.paysCreditCard && (
                          <span className="text-emerald-600 dark:text-emerald-500">
                            {' '}
                            • Pagamento fatura: {t.paysCreditCard.name}
                            {t.paysCreditCard.lastFour
                              ? ` •••• ${t.paysCreditCard.lastFour}`
                              : ''}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 pl-11 sm:justify-end sm:pl-0">
                    <span className="font-semibold tabular-nums text-red-500">
                      R${' '}
                      {t.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <DeleteTransactionButton id={t.id} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
