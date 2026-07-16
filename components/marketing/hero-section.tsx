'use client'

import { Link } from '@/lib/i18n/navigation'
import { useTranslations } from 'next-intl'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AppMockup from './app-mockup'

export default function HeroSection() {
  const t = useTranslations('marketing.hero')

  const trustPoints = [
    t('trustNoCard'),
    t('trustCancel'),
    t('trustPrivacy'),
  ]

  return (
    <section className="min-h-[100dvh] flex items-center pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[55fr_45fr] gap-12 lg:gap-16 items-center py-16 lg:py-24">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-full px-4 py-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">
                {t('trialBadge')}
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tighter leading-[1.05] text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)]">
              {t('headline1')}
              <br />
              {t('headline2')}
              <br />
              <span className="text-primary">{t('headline3')}</span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-[50ch]">
              {t('subheadline')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild className="text-base group">
                <Link href="/registro">
                  {t('ctaPrimary')}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-base">
                <Link href="/login">{t('ctaSecondary')}</Link>
              </Button>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {trustPoints.map((item) => (
                <div key={item} className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-4 relative">
            <div className="absolute -inset-6 bg-primary/5 dark:bg-primary/10 rounded-3xl blur-3xl pointer-events-none" />
            <div className="relative">
              <AppMockup />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
