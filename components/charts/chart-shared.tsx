'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { formatCurrency, getCurrencySymbol } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'

/** Tooltip alinhado ao tema (light/dark) e contraste legível */
export const chartTooltipContentStyle: CSSProperties = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.06)',
}

export const chartTooltipLabelStyle: CSSProperties = {
  color: 'hsl(var(--popover-foreground))',
  fontWeight: 600,
  fontSize: 12,
}

export const chartTooltipItemStyle: CSSProperties = {
  color: 'hsl(var(--popover-foreground))',
  fontSize: 12,
}

export const chartAxisTick = { fill: 'hsl(var(--muted-foreground))', fontSize: 11 }

export const chartLegendStyle: CSSProperties = {
  paddingTop: 16,
}

export function useChartCurrency() {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  return (value: number) => formatCurrency(value, locale, currency)
}

/** Compact axis tick label, e.g. "R$2k" / "$2k" / "€2k" */
export function useChartCurrencyAxisTick() {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const symbol = getCurrencySymbol(locale, currency)
  return (value: number) =>
    value >= 1000 ? `${symbol}${value / 1000}k` : `${symbol}${value}`
}

export function ChartEmpty({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'flex min-h-[220px] w-full items-center justify-center px-4 text-center text-sm text-muted-foreground sm:min-h-[260px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export const chartSurfaceClass = 'h-[260px] w-full sm:h-[280px]'

/** Shell visual alinhado ao dashboard bento (use em Card de gráficos) */
export const chartCardClassName =
  'rounded-[var(--dashboard-bento-radius)] border-border/90 shadow-sm'
