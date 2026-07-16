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
  useChartCurrency,
  useChartCurrencyAxisTick,
} from '@/components/charts/chart-shared'
import { useLocale, useTranslations } from 'next-intl'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

interface DataPoint {
  name: string
  value: number
  color: string
}

export function ExpensesByCategoryChart({ data }: { data: DataPoint[] }) {
  const t = useTranslations('common.charts')
  const locale = useLocale() as AppLocale
  const formatValue = useChartCurrency()
  const formatAxisTick = useChartCurrencyAxisTick()
  const localizedData = data.map((entry) => ({
    ...entry,
    name: localizeStoredLabel(entry.name, locale),
  }))
  if (localizedData.length === 0) {
    return <ChartEmpty>{t('noExpenses')}</ChartEmpty>
  }

  return (
    <div
      className={chartSurfaceClass}
      role="img"
      aria-label={t('expensesByCategory')}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={localizedData}
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
            tickFormatter={formatAxisTick}
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
            formatter={(value: number) => formatValue(value)}
            cursor={{ fill: 'hsl(var(--muted) / 0.35)' }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {localizedData.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
