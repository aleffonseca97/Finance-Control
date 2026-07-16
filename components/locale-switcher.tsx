'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { Languages } from 'lucide-react'
import { usePathname, useRouter } from '@/lib/i18n/navigation'
import { updateLocale } from '@/app/actions/locale'
import type { AppLocale } from '@/i18n/routing'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const localeLabels: Record<AppLocale, string> = {
  'pt-BR': 'Português',
  en: 'English',
  it: 'Italiano',
}

type LocaleSwitcherProps = {
  variant?: 'compact' | 'full'
  className?: string
}

export function LocaleSwitcher({ variant = 'compact', className }: LocaleSwitcherProps) {
  const t = useTranslations('settings.language')
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value
    if (!routing.locales.includes(nextLocale as AppLocale)) return
    if (nextLocale === locale) return

    startTransition(async () => {
      await updateLocale(nextLocale)
      router.replace(pathname, { locale: nextLocale as AppLocale })
      router.refresh()
    })
  }

  const select = (
    <Select
      value={locale}
      onChange={onChange}
      disabled={pending}
      aria-label={t('title')}
      className={variant === 'compact' ? 'h-9 w-[130px] border-0 bg-transparent px-1 text-sm shadow-none' : 'w-full sm:w-[180px]'}
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {localeLabels[code as AppLocale]}
        </option>
      ))}
    </Select>
  )

  if (variant === 'full') {
    return (
      <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
            <Languages className="h-4 w-4" aria-hidden />
          </div>
          <div>
            <p className="font-semibold">{t('title')}</p>
            <p className="text-sm text-muted-foreground">{t('description')}</p>
          </div>
        </div>
        {select}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      {select}
    </div>
  )
}

export function LocaleSwitcherButtons({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function switchTo(nextLocale: AppLocale) {
    if (nextLocale === locale || pending) return
    startTransition(async () => {
      await updateLocale(nextLocale)
      router.replace(pathname, { locale: nextLocale })
      router.refresh()
    })
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {routing.locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? 'default' : 'ghost'}
          className="h-8 px-2 text-xs"
          disabled={pending}
          onClick={() => switchTo(code as AppLocale)}
        >
          {localeLabels[code as AppLocale]}
        </Button>
      ))}
    </div>
  )
}
