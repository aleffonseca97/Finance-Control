import { getCategoriesByType } from '@/app/actions/categories';
import { getInvestments, createInvestment } from '@/app/actions/investments';
import { DeleteInvestmentButton } from '@/components/forms/delete-investment-button';
import { CategoryIcon } from '@/components/category/category-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestimentosGrid } from './investimentos-grid';

export default async function InvestimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>;
}) {
  const params = await searchParams;
  const month = params.month ? parseInt(params.month, 10) : undefined;
  const year = params.year ? parseInt(params.year, 10) : undefined;

  const [categories, { investments, total }] = await Promise.all([
    getCategoriesByType('investment'),
    getInvestments(month, year),
  ]);

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
            <h1 className="text-2xl font-bold">Investimentos</h1>
            <p className="text-muted-foreground">Acompanhe seus aportes</p>
          </div>
        </div>

        <InvestimentosGrid
          monthLabel={`${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)} de ${y}`}
          month={m}
          year={y}
          daysInMonth={daysInMonth}
          categories={categories}
          action={
            createInvestment as (
              formData: FormData,
            ) => Promise<{ error?: string; success?: boolean }>
          }
        />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Total do período</CardTitle>
          <p className="text-xl font-bold text-blue-500">
            R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </CardHeader>
        <CardContent>
          {investments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum aporte neste período
            </p>
          ) : (
            <div className="space-y-2">
              {investments.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="rounded-full p-2"
                      style={{ backgroundColor: `${inv.category.color}20` }}
                    >
                      <CategoryIcon
                        icon={inv.category.icon}
                        className="text-foreground"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{inv.category.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(inv.date).toLocaleDateString('pt-BR')}
                        {inv.notes && ` • ${inv.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-500">
                      R${' '}
                      {inv.amount.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                    <DeleteInvestmentButton id={inv.id} />
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
