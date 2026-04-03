'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  ChartEmpty,
  chartLegendStyle,
  chartSurfaceClass,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  formatChartCurrency,
} from '@/components/charts/chart-shared'

const SLICE_COLOR: Record<string, string> = {
  Entradas: 'hsl(var(--chart-income))',
  Saídas: 'hsl(var(--chart-expense))',
  'Gastos Cartão': 'hsl(var(--chart-card))',
}

interface DataPoint {
  name: string
  value: number
}

export function IncomeExpensePieChart({
  income,
  expense,
  creditCardExpense = 0,
}: {
  income: number
  expense: number
  creditCardExpense?: number
}) {
  const expenseWithoutCard = Math.max(0, expense - creditCardExpense)
  const data: DataPoint[] = [
    { name: 'Entradas', value: income },
    { name: 'Saídas', value: expenseWithoutCard },
    { name: 'Gastos Cartão', value: creditCardExpense },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <ChartEmpty>Adicione transações para ver o gráfico</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label="Gráfico de rosca: entradas, saídas e gastos no cartão"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={3}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((d) => (
              <Cell key={d.name} fill={SLICE_COLOR[d.name] ?? 'hsl(var(--chart-1))'} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={chartTooltipContentStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(value: number) => formatChartCurrency(value)}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ ...chartLegendStyle, fontSize: 12, color: 'hsl(var(--muted-foreground))' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
