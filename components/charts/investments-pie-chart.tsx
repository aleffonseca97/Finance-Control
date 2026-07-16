'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  ChartEmpty,
  chartLegendStyle,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  useChartCurrency,
} from '@/components/charts/chart-shared'
import { useTranslations } from 'next-intl'

type InvestmentPieDatum = {
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

export function InvestmentsPieChart({ data }: { data: InvestmentPieDatum[] }) {
  const t = useTranslations('common.charts')
  const formatValue = useChartCurrency()
  const filtered = data.filter((d) => d.value > 0)

  if (filtered.length === 0) {
    return (
      <ChartEmpty className="min-h-[200px] sm:min-h-[240px]">
        {t('addInvestments')}
      </ChartEmpty>
    )
  }

  return (
    <div
      className="h-[220px] w-full sm:h-[260px]"
      role="img"
      aria-label={t('investmentsDistribution')}
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
            formatter={(value: number) => formatValue(value)}
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
