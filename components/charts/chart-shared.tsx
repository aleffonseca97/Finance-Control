'use client'

import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/lib/utils'

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

export function formatChartCurrency(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
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
