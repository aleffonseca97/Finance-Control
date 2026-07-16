'use client'

import { MoonStar, Smartphone, Sun } from 'lucide-react'
import { useTranslations } from 'next-intl'
import AppMockup from './app-mockup'

export default function MobileDarkModeSection() {
  const t = useTranslations('marketing.mobile')

  const highlights = [
    {
      icon: Smartphone,
      title: t('responsiveTitle'),
      description: t('responsiveDescription'),
    },
    {
      icon: MoonStar,
      title: t('darkModeTitle'),
      description: t('darkModeDescription'),
    },
  ]

  return (
    <section className="py-24 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-12 items-stretch">
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-8 lg:p-10 flex flex-col justify-center">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              {t('eyebrow')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
              {t('title')}
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed mt-4 max-w-[58ch]">
              {t('description')}
            </p>

            <div className="mt-6 grid grid-cols-1 gap-3">
              {highlights.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex gap-3 items-start"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-primary" strokeWidth={1.6} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 [font-family:var(--font-outfit)] mb-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                )
              })}

              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-800 p-4 flex items-center justify-between gap-4">
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {t('toggleHint')}
                </span>
                <div className="inline-flex items-center rounded-full border border-zinc-300 dark:border-zinc-700 p-1 bg-white/80 dark:bg-zinc-950">
                  <span className="w-7 h-7 rounded-full bg-zinc-900 text-white inline-flex items-center justify-center">
                    <MoonStar className="w-4 h-4" />
                  </span>
                  <span className="w-7 h-7 rounded-full text-zinc-500 inline-flex items-center justify-center">
                    <Sun className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <AppMockup variant="mobile" />
          </div>
        </div>
      </div>
    </section>
  )
}
