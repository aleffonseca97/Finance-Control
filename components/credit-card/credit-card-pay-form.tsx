'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from '@/lib/i18n/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { payCreditCardFromBalance } from '@/app/actions/credit-cards'
import type { CreditCard } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'

function SubmitPayButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('dashboard.creditCard')
  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="min-h-10 touch-manipulation sm:min-h-9"
    >
      {pending ? t('registering') : t('confirmPayment')}
    </Button>
  )
}

type CreditCardPayFormProps = {
  card: CreditCard
  availableCash: number
  maxPay: number
  onDone?: () => void
}

export function CreditCardPayForm({
  card,
  availableCash,
  maxPay,
  onDone,
}: CreditCardPayFormProps) {
  const router = useRouter()
  const t = useTranslations('dashboard.creditCard')
  const tForms = useTranslations('forms')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setError('')
    formData.set('creditCardId', card.id)
    const result = await payCreditCardFromBalance(formData)
    if (result?.error) setError(result.error)
    else if (result?.success) {
      router.refresh()
      onDone?.()
    }
  }

  if (maxPay <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t('noInvoice')}
      </p>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-3 pt-3 border-t">
      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        {t.rich('payHelp', {
          cash: (chunks) => <strong>{chunks}</strong>,
          expense: (chunks) => <strong>{chunks}</strong>,
          limit: (chunks) => <strong>{chunks}</strong>,
        })}
      </p>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-2">
        <span>
          {t('availableCash')}{': '}
          <span className="font-medium text-foreground">
            {formatCurrency(availableCash, locale, currency)}
          </span>
        </span>
        <span className="hidden sm:inline">·</span>
        <span>
          {t('maxPayment')}{': '}
          <span className="font-medium text-foreground">
            {formatCurrency(maxPay, locale, currency)}
          </span>
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`pay-amount-${card.id}`}>{tForms('labels.amount')}</Label>
          <Input
            id={`pay-amount-${card.id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={maxPay}
            required
            placeholder={tForms('placeholders.amount')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pay-date-${card.id}`}>{tForms('labels.date')}</Label>
          <Input
            id={`pay-date-${card.id}`}
            name="date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitPayButton />
        {onDone ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDone}
            className="min-h-10 touch-manipulation sm:min-h-9"
          >
            {tForms('buttons.cancel')}
          </Button>
        ) : null}
      </div>
    </form>
  )
}
