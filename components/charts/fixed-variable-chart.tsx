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
  'Despesas fixas': 'hsl(var(--chart-fixed))',
  'Despesas variáveis': 'hsl(var(--chart-variable))',
}

export function FixedVariableChart({ fixed, variable }: { fixed: number; variable: number }) {
  const data = [
    { name: 'Despesas fixas', value: fixed },
    { name: 'Despesas variáveis', value: variable },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <ChartEmpty>Adicione despesas para ver o gráfico</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label="Gráfico de rosca: despesas fixas e variáveis"
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
