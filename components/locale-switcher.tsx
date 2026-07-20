'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useId, useRef, useState, useTransition } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
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

const localeFlags: Record<AppLocale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸',
  it: '🇮🇹',
}

type LocaleSwitcherProps = {
  variant?: 'compact' | 'full'
  className?: string
}

function useLocaleSwitch() {
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

  return { locale, pending, switchTo }
}

export function LocaleSwitcher({ variant = 'compact', className }: LocaleSwitcherProps) {
  const t = useTranslations('settings.language')
  const { locale, pending, switchTo } = useLocaleSwitch()

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value
    if (!routing.locales.includes(nextLocale as AppLocale)) return
    switchTo(nextLocale as AppLocale)
  }

  const select = (
    <Select
      value={locale}
      onChange={onChange}
      disabled={pending}
      aria-label={t('title')}
      className={
        variant === 'compact'
          ? 'h-9 w-[130px] border-0 bg-transparent px-1 text-sm shadow-none'
          : 'w-full sm:w-[180px]'
      }
    >
      {routing.locales.map((code) => (
        <option key={code} value={code}>
          {localeFlags[code as AppLocale]} {localeLabels[code as AppLocale]}
        </option>
      ))}
    </Select>
  )

  if (variant === 'full') {
    return (
      <div
        className={cn(
          'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between',
          className,
        )}
      >
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
  const t = useTranslations('settings.language')
  const { locale, pending, switchTo } = useLocaleSwitch()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function handleSelect(nextLocale: AppLocale) {
    setOpen(false)
    switchTo(nextLocale)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2"
        disabled={pending}
        aria-label={t('title')}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-base leading-none" aria-hidden>
          {localeFlags[locale]}
        </span>
        <span className="text-xs font-medium">{localeLabels[locale]}</span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-150',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </Button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('title')}
          className="absolute right-0 top-full z-50 mt-1 min-w-[10.5rem] overflow-hidden rounded-lg border border-border/80 bg-card p-1 shadow-lg"
        >
          {routing.locales.map((code) => {
            const selected = locale === code
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  disabled={pending}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors',
                    selected
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                  )}
                  onClick={() => handleSelect(code as AppLocale)}
                >
                  <span className="text-base leading-none" aria-hidden>
                    {localeFlags[code as AppLocale]}
                  </span>
                  <span className="flex-1 text-left">{localeLabels[code as AppLocale]}</span>
                  {selected && <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
