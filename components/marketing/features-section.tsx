'use client'

import {
  TrendingUp,
  CreditCard,
  Target,
  BarChart2,
  RefreshCw,
  Wallet,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

const featureKeys = [
  { key: 'cashFlow', icon: TrendingUp },
  { key: 'creditCard', icon: CreditCard },
  { key: 'goals', icon: Target },
  { key: 'analysis', icon: BarChart2 },
  { key: 'recurring', icon: RefreshCw },
  { key: 'investments', icon: Wallet },
] as const

export default function FeaturesSection() {
  const t = useTranslations('marketing.features')

  return (
    <section id="funcionalidades" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight mb-4">
            {t('title')}
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-zinc-200 dark:border-zinc-800">
          {featureKeys.map((feature, index) => {
            const Icon = feature.icon
            const item = t.raw(`items.${feature.key}`) as {
              title: string
              description: string
              tag: string
            }

            return (
              <div
                key={feature.key}
                className="group py-8 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors duration-200"
                style={{
                  paddingLeft: index % 2 === 1 ? '2.5rem' : '0',
                  paddingRight: index % 2 === 0 ? '2.5rem' : '0',
                }}
              >
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 dark:group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 [font-family:var(--font-outfit)]">
                        {item.title}
                      </h3>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {item.tag}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
