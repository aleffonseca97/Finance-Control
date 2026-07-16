'use client'

import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PricingSection() {
  const t = useTranslations('marketing.pricing')
  const includedFeatures = t.raw('features') as string[]

  return (
    <section id="precos" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            {t('eyebrow')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
            {t('title')}
          </h2>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-white dark:bg-zinc-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-bl-full -translate-y-10 translate-x-10 pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {t('trialBadge')}
                </span>
              </div>

              <div className="mb-2">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)]">
                    {t('price')}
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 pb-1.5 text-sm">{t('perMonth')}</span>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                {t('afterTrial')}
              </p>

              <Button className="w-full mb-4 text-base group" size="lg" asChild>
                <Link href="/registro">
                  {t('cta')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </Button>

              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mb-7">
                {t('trust')}
              </p>

              <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                {includedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                      <Check
                        className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
