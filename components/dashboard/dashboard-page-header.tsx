import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type DashboardPageHeaderProps = {
  title: string
  description?: string
  /** Ícone ou elemento antes do título (ex.: boas-vindas) */
  leading?: ReactNode
  actions?: ReactNode
  className?: string
}

export function DashboardPageHeader({
  title,
  description,
  leading,
  actions,
  className,
}: DashboardPageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className={cn('min-w-0', leading && 'flex items-center gap-2')}>
          {leading}
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">{actions}</div>
      ) : null}
    </header>
  )
}
