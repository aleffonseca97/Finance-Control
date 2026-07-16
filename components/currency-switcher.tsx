'use client'

import { useTranslations } from 'next-intl'
import { useTransition } from 'react'
import { Coins } from 'lucide-react'
import { useRouter } from '@/lib/i18n/navigation'
import { updateCurrency } from '@/app/actions/currency'
import { useCurrency } from '@/components/currency-provider'
import { currencies, isAppCurrency } from '@/lib/i18n/currency'
import { Select } from '@/components/ui/select'
import { cn } from '@/lib/utils'

type CurrencySwitcherProps = {
  className?: string
}

export function CurrencySwitcher({ className }: CurrencySwitcherProps) {
  const t = useTranslations('settings.currency')
  const currency = useCurrency()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCurrency = event.target.value
    if (!isAppCurrency(nextCurrency)) return
    if (nextCurrency === currency) return

    startTransition(async () => {
      await updateCurrency(nextCurrency)
      router.refresh()
    })
  }

  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-background">
          <Coins className="h-4 w-4" aria-hidden />
        </div>
        <div>
          <p className="font-semibold">{t('title')}</p>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
          <p className="text-xs text-muted-foreground">{t('noConversionNote')}</p>
        </div>
      </div>
      <Select
        value={currency}
        onChange={onChange}
        disabled={pending}
        aria-label={t('title')}
        className="w-full sm:w-[180px]"
      >
        {currencies.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </Select>
    </div>
  )
}
