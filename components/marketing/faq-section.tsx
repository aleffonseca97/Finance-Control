'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type FaqItem = {
  question: string
  answer: string
}

export default function FaqSection() {
  const t = useTranslations('marketing.faq')
  const faqs = t.raw('items') as FaqItem[]
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-16 items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
              {t('eyebrow')}
            </p>
            <h2 className="text-3xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
              {t('title')}
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-4 text-sm leading-relaxed max-w-[28ch]">
              {t('subtitle')}
            </p>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  className="w-full py-5 flex items-center justify-between text-left gap-4 group"
                  onClick={() => setOpen(open === index ? null : index)}
                  aria-expanded={open === index}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 group-hover:text-primary transition-colors duration-150 leading-snug">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200',
                      open === index && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    open === index ? 'max-h-48 pb-5' : 'max-h-0'
                  )}
                >
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
