'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  chartLegendStyle,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  useChartCurrency,
} from '@/components/charts/chart-shared'
import { useTranslations } from 'next-intl'

type GoalsPieChartProps = {
  achieved: number
  remaining: number
}

const COLORS = {
  achieved: 'hsl(var(--chart-income))',
  remaining: 'hsl(var(--chart-expense))',
}

export function GoalsPieChart({ achieved, remaining }: GoalsPieChartProps) {
  const tGoals = useTranslations('dashboard.goals')
  const tCharts = useTranslations('common.charts')
  const formatValue = useChartCurrency()
  const data = [
    { name: tGoals('achieved'), value: achieved, color: COLORS.achieved },
    { name: tGoals('remaining'), value: remaining, color: COLORS.remaining },
  ].filter((item) => item.value > 0)

  return (
    <div className="h-[220px] w-full sm:h-[240px]" role="img" aria-label={tCharts('goalsProgress')}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="82%"
            paddingAngle={2}
            dataKey="value"
            stroke="hsl(var(--background))"
            strokeWidth={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
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
