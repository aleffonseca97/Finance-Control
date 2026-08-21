'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/lib/i18n/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Repeat,
  PiggyBank,
  CreditCard,
  Flag,
  BarChart3,
  Receipt,
  Table2,
  Tv,
  Settings,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react'

type ShortcutDescKey =
  | 'incomes'
  | 'expenses'
  | 'recurringPayments'
  | 'recurringInvestments'
  | 'creditCard'
  | 'investments'
  | 'goals'
  | 'analysis'
  | 'installments'
  | 'subscriptions'
  | 'annualTable'
  | 'settings'

const MOBILE_VISIBLE_COUNT = 4

const shortcuts: {
  href: string
  labelKey: ShortcutDescKey
  descKey: ShortcutDescKey
  icon: LucideIcon
}[] = [
  {
    href: '/dashboard/entradas',
    labelKey: 'incomes',
    descKey: 'incomes',
    icon: TrendingUp,
  },
  {
    href: '/dashboard/saidas',
    labelKey: 'expenses',
    descKey: 'expenses',
    icon: TrendingDown,
  },
  {
    href: '/dashboard/pagamentos-recorrentes',
    labelKey: 'recurringPayments',
    descKey: 'recurringPayments',
    icon: Repeat,
  },
  {
    href: '/dashboard/recorrencia/investimentos',
    labelKey: 'recurringInvestments',
    descKey: 'recurringInvestments',
    icon: PiggyBank,
  },
  {
    href: '/dashboard/cartao-credito',
    labelKey: 'creditCard',
    descKey: 'creditCard',
    icon: CreditCard,
  },
  {
    href: '/dashboard/investimentos',
    labelKey: 'investments',
    descKey: 'investments',
    icon: PiggyBank,
  },
  { href: '/dashboard/metas', labelKey: 'goals', descKey: 'goals', icon: Flag },
  {
    href: '/dashboard/analise',
    labelKey: 'analysis',
    descKey: 'analysis',
    icon: BarChart3,
  },
  {
    href: '/dashboard/parcelamentos',
    labelKey: 'installments',
    descKey: 'installments',
    icon: Receipt,
  },
  {
    href: '/dashboard/assinaturas',
    labelKey: 'subscriptions',
    descKey: 'subscriptions',
    icon: Tv,
  },
  {
    href: '/dashboard/tabela-anual',
    labelKey: 'annualTable',
    descKey: 'annualTable',
    icon: Table2,
  },
  {
    href: '/dashboard/configuracoes',
    labelKey: 'settings',
    descKey: 'settings',
    icon: Settings,
  },
]

export function DashboardShortcuts() {
  const t = useTranslations('nav')
  const tOverview = useTranslations('dashboard.overview')
  const tDesc = useTranslations('dashboard.overview.shortcutDescriptions')
  const [expanded, setExpanded] = useState(false)

  const hiddenCount = shortcuts.length - MOBILE_VISIBLE_COUNT

  return (
    <section className="space-y-3">
      <p className="dashboard-section-label">{tOverview('shortcuts')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:grid-cols-6">
        {shortcuts.map((item, index) => {
          const Icon = item.icon
          const label = t(item.labelKey)
          const description = tDesc(item.descKey)
          const hideOnMobile = !expanded && index >= MOBILE_VISIBLE_COUNT
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={`${label}. ${description}`}
              className={cn(
                'dashboard-bento-card-muted flex min-h-11 cursor-pointer flex-col items-center gap-1.5 px-2 py-2.5 text-center sm:gap-2 sm:px-3 sm:py-4',
                'transition-[border-color,background-color,transform] duration-200 motion-reduce:transition-none',
                'hover:border-primary/25 hover:bg-muted/50',
                'active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                hideOnMobile && 'max-sm:hidden',
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </span>
              <span className="space-y-0.5">
                <span className="block text-[0.6875rem] font-medium leading-snug text-foreground sm:text-sm">
                  {label}
                </span>
                <span className="block text-[0.625rem] leading-snug text-muted-foreground sm:text-xs">
                  {description}
                </span>
              </span>
            </Link>
          )
        })}
      </div>
      {hiddenCount > 0 ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full gap-1.5 text-muted-foreground sm:hidden"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
        >
          {expanded ? (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden />
              {tOverview('shortcutsShowLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden />
              {tOverview('shortcutsShowMore', { count: hiddenCount })}
            </>
          )}
        </Button>
      ) : null}
    </section>
  )
}
