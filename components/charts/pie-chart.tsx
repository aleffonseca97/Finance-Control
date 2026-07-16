'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import {
  ChartEmpty,
  chartLegendStyle,
  chartSurfaceClass,
  chartTooltipContentStyle,
  chartTooltipItemStyle,
  chartTooltipLabelStyle,
  useChartCurrency,
} from '@/components/charts/chart-shared'
import { useTranslations } from 'next-intl'

interface DataPoint {
  name: string
  value: number
  color: string
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
  const t = useTranslations('common.charts')
  const formatValue = useChartCurrency()
  const expenseWithoutCard = Math.max(0, expense - creditCardExpense)
  const data: DataPoint[] = [
    { name: t('income'), value: income, color: 'hsl(var(--chart-income))' },
    { name: t('expense'), value: expenseWithoutCard, color: 'hsl(var(--chart-expense))' },
    { name: t('creditCardSpending'), value: creditCardExpense, color: 'hsl(var(--chart-card))' },
  ].filter((d) => d.value > 0)

  if (data.length === 0) {
    return <ChartEmpty>{t('addTransactions')}</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label={t('incomeExpenseDonut')}
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
              <Cell key={d.name} fill={d.color} />
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
