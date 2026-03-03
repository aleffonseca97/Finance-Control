'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type AnalysisRow = {
  label: string;
  income: number;
  fixedExpense: number;
  variableExpense: number;
  balance: number;
};

type FinancialAnalysisTableProps = {
  dailyData: AnalysisRow[];
  monthlyData: AnalysisRow[];
  annualData: AnalysisRow[];
};

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function getBalanceColor(balance: number): string {
  if (balance <= 0) return 'rgb(239, 68, 68)';
  if (balance >= 100) return 'rgb(34, 197, 94)';

  const ratio = balance / 100;
  const r = Math.round(239 + (34 - 239) * ratio);
  const g = Math.round(68 + (197 - 68) * ratio);
  const b = Math.round(68 + (94 - 68) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}

function SectionTable({
  title,
  labelTitle,
  rows,
}: {
  title: string;
  labelTitle: string;
  rows: AnalysisRow[];
}) {
  return (
    <section className="min-w-[760px] flex-shrink-0">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
                {labelTitle}
              </th>
              <th className="px-3 py-2 text-right font-semibold">Entrada</th>
              <th className="px-3 py-2 text-right font-semibold">Saida (Fixa)</th>
              <th className="px-3 py-2 text-right font-semibold">
                Saida (Variavel)
              </th>
              <th className="px-3 py-2 text-right font-semibold">Saldo Final</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${title}-${row.label}`}
                className="border-b last:border-none"
              >
                <td className="sticky left-0 bg-card px-3 py-2 font-medium">
                  {row.label}
                </td>
                <td className="px-3 py-2 text-right text-emerald-500">
                  {formatCurrency(row.income)}
                </td>
                <td className="px-3 py-2 text-right text-violet-500">
                  {formatCurrency(row.fixedExpense)}
                </td>
                <td className="px-3 py-2 text-right text-orange-500">
                  {formatCurrency(row.variableExpense)}
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className="inline-block rounded-md px-2.5 py-1 text-xs font-semibold text-white"
                    style={{ backgroundColor: getBalanceColor(row.balance) }}
                  >
                    {formatCurrency(row.balance)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FinancialAnalysisTable({
  dailyData,
  monthlyData,
  annualData,
}: FinancialAnalysisTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabela Anual</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max gap-6">
            <SectionTable title="Diario" labelTitle="Dia" rows={dailyData} />
            <SectionTable title="Mensal" labelTitle="Mes" rows={monthlyData} />
            <SectionTable title="Anual" labelTitle="Ano" rows={annualData} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
