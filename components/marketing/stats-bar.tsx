'use client'

import { useTranslations } from 'next-intl'

export default function StatsBar() {
  const t = useTranslations('marketing.stats')

  const stats = [
    { value: t('trial.value'), label: t('trial.label') },
    { value: t('price.value'), label: t('price.label') },
    { value: t('loyalty.value'), label: t('loyalty.label') },
    { value: t('privacy.value'), label: t('privacy.label') },
  ]

  return (
    <section className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="space-y-0.5">
              <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
