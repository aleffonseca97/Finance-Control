'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartEmpty,
  chartAxisTick,
  chartSurfaceClass,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  formatChartCurrency,
} from '@/components/charts/chart-shared'

const SERIES = {
  income: { stroke: 'hsl(var(--chart-income))', key: 'income' as const, name: 'income' },
  expense: { stroke: 'hsl(var(--chart-expense))', key: 'expense' as const, name: 'expense' },
  investment: { stroke: 'hsl(var(--chart-investment))', key: 'investment' as const, name: 'investment' },
}

interface DataPoint {
  month: string
  income: number
  expense: number
  investment: number
}

const legendLabels: Record<string, string> = {
  income: 'Entradas',
  expense: 'Saídas',
  investment: 'Investimentos',
}

export function MonthlyEvolutionChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty>Nenhum dado para o período</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label="Gráfico de linhas: evolução mensal de entradas, saídas e investimentos"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" strokeOpacity={0.45} />
          <XAxis
            dataKey="month"
            tick={chartAxisTick}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickMargin={8}
          />
          <YAxis
            tick={chartAxisTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => (v >= 1000 ? `R$${v / 1000}k` : `R$${v}`)}
            width={52}
          />
          <Tooltip
            contentStyle={chartTooltipContentStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(value: number) => formatChartCurrency(value)}
            labelFormatter={(label) => String(label)}
            cursor={{ stroke: 'hsl(var(--muted-foreground) / 0.35)', strokeWidth: 1 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="line"
            wrapperStyle={{ fontSize: 12, color: 'hsl(var(--muted-foreground))', paddingBottom: 8 }}
            formatter={(value) => legendLabels[value] ?? value}
          />
          <Line
            type="monotone"
            dataKey={SERIES.income.key}
            name={SERIES.income.name}
            stroke={SERIES.income.stroke}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey={SERIES.expense.key}
            name={SERIES.expense.name}
            stroke={SERIES.expense.stroke}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey={SERIES.investment.key}
            name={SERIES.investment.name}
            stroke={SERIES.investment.stroke}
            strokeWidth={2.5}
            dot={{ r: 3, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
