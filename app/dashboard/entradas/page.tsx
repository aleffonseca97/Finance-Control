import { getCategoriesByType } from '@/app/actions/categories';
import { getTransactions } from '@/app/actions/transactions';
import { MonthFilter } from '@/components/forms/month-filter';
import { DeleteTransactionButton } from '@/components/forms/delete-transaction-button';
import { CategoryIcon } from '@/components/category/category-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EntradasTable } from './entradas-table';

export default async function EntradasPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;

  const [categories, { transactions, total }] = await Promise.all([
    getCategoriesByType('income'),
    getTransactions('income', month, year),
  ]);

  const transactionsByDay: Record<number, (typeof transactions)[number]> = {};
  transactions.forEach((t) => {
    const day = new Date(t.date).getDate();
    if (!(day in transactionsByDay)) {
      transactionsByDay[day] = t;
    }
  });

  const now = new Date();
  const m = month ?? now.getMonth();
  const y = year ?? now.getFullYear();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const monthLabel = new Date(y, m, 1).toLocaleDateString('pt-BR', {
    month: 'long',
  });

  return (
    <div className="space-y-6 p-6 pt-8 md:p-8 md:pt-10">
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Entradas</h1>
            <p className="text-muted-foreground">Controle suas receitas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[340px,1fr] gap-6">
          <Card className="border-primary/40 bg-primary/5 h-fit">
            <CardContent className="flex flex-col gap-4 py-4">
              <div>
                <p className="text-xs font-medium uppercase text-primary/70 tracking-wide">
                  Mês em edição
                </p>
                <p className="text-lg font-semibold">
                  {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} de {y}
                </p>
              </div>
              <div className="w-full">
                <MonthFilter />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lançamentos diários do mês</CardTitle>
            </CardHeader>
            <CardContent>
              <EntradasTable
                categories={categories}
                transactionsByDay={transactionsByDay}
                daysInMonth={daysInMonth}
                month={m}
                year={y}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Total do período</CardTitle>
          <p className="text-xl font-bold text-emerald-500">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma entrada neste período
            </p>
          ) : (
            <div className="space-y-2">
              {transactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: `${t.category.color}20` }}
                    >
                      <CategoryIcon
                        icon={t.category.icon}
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{t.category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {t.description ||
                          new Date(t.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-emerald-500">
                      R${' '}
                      {t.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <DeleteTransactionButton id={t.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
