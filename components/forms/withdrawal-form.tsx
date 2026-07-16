'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { ReserveWalletBalance } from '@/app/actions/investments'
import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

interface WithdrawalFormProps {
  balances: ReserveWalletBalance[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  dateValue?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('forms')
  return (
    <Button type="submit" disabled={pending} variant="outline">
      {pending ? t('investment.processing') : t('buttons.confirm')}
    </Button>
  )
}

export function WithdrawalForm({ balances, action, dateValue }: WithdrawalFormProps) {
  const tLabels = useTranslations('forms.labels')
  const tPlaceholders = useTranslations('forms.placeholders')
  const tInvestment = useTranslations('forms.investment')
  const tTransaction = useTranslations('forms.transaction')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [error, setError] = useState('')
  const [selectedKey, setSelectedKey] = useState('')
  const today = new Date().toISOString().slice(0, 10)
  const selected = balances.find(
    (b) => `${b.reserveCategory.id}:${b.walletCategory.id}` === selectedKey
  )

  async function handleSubmit(formData: FormData) {
    setError('')
    if (selectedKey) {
      const [reserveId, walletId] = selectedKey.split(':')
      formData.set('reserveCategoryId', reserveId)
      formData.set('walletCategoryId', walletId)
    }
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      const form = document.getElementById('withdrawal-form') as HTMLFormElement | null
      if (form) {
        form.reset()
        setSelectedKey('')
        const dateInput = form.querySelector<HTMLInputElement>('[name="date"]')
        if (dateInput) dateInput.value = dateValue ?? today
      }
    }
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {tInvestment('noBalances')}
      </div>
    )
  }

  return (
    <form
      id="withdrawal-form"
      action={handleSubmit}
      className="space-y-4 rounded-lg border bg-card p-4"
    >
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="withdrawal-source">{tInvestment('origin')}</Label>
          <Select
            id="withdrawal-source"
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
            required
          >
            <option value="">{tInvestment('selectOrigin')}</option>
            {balances.map((b) => {
              const key = `${b.reserveCategory.id}:${b.walletCategory.id}`
              return (
                <option key={key} value={key}>
                  {localizeStoredLabel(b.reserveCategory.name, locale)} →{' '}
                  {localizeStoredLabel(b.walletCategory.name, locale)}:{' '}
                  {formatCurrency(b.balance, locale, currency)}
                </option>
              )
            })}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="withdrawal-amount">{tLabels('amount')}</Label>
          <Input
            id="withdrawal-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder={tPlaceholders('amount')}
            required
            max={selected?.balance}
          />
          {selected && (
            <p className="text-xs text-muted-foreground">
              {tInvestment('availableBalance')} {formatCurrency(selected.balance, locale, currency)}
            </p>
          )}
        </div>
        {dateValue == null ? (
          <div className="space-y-2">
            <Label htmlFor="withdrawal-date">{tLabels('date')}</Label>
            <Input
              id="withdrawal-date"
              name="date"
              type="date"
              defaultValue={today}
              required
            />
          </div>
        ) : (
          <input type="hidden" name="date" value={dateValue} />
        )}
        <div className="space-y-2">
          <Label htmlFor="withdrawal-notes">{tLabels('notes')}</Label>
          <Input id="withdrawal-notes" name="notes" type="text" placeholder={tTransaction('optional')} />
        </div>
      </div>
      <SubmitButton />
    </form>
  )
}
