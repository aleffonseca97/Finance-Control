'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

interface DataPoint {
  name: string
  value: number
  color: string
}

export function ExpensesByCategoryChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <ChartEmpty>Nenhuma despesa neste período</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label="Gráfico de barras: despesas por categoria"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 12, top: 8, bottom: 8 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" strokeOpacity={0.45} />
          <XAxis
            type="number"
            tick={chartAxisTick}
            tickLine={false}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(v) => (v >= 1000 ? `R$${v / 1000}k` : `R$${v}`)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={108}
            tick={chartAxisTick}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={chartTooltipContentStyle}
            labelStyle={chartTooltipLabelStyle}
            itemStyle={chartTooltipItemStyle}
            formatter={(value: number) => formatChartCurrency(value)}
            cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
