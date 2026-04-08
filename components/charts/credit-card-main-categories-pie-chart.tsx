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

type CreditCardMainCategoryDatum = {
  name: string
  value: number
  color?: string | null
}

const FALLBACK_FILLS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

export function CreditCardMainCategoriesPieChart({ data }: { data: CreditCardMainCategoryDatum[] }) {
  const filtered = data.filter((item) => item.value > 0)

  if (filtered.length === 0) {
    return <ChartEmpty>Nenhum gasto no cartão para exibir</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label="Gráfico de rosca: gastos no cartão por categoria principal"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={filtered}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {filtered.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={entry.color || FALLBACK_FILLS[index % FALLBACK_FILLS.length]}
              />
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
