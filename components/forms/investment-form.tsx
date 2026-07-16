'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Category } from '@prisma/client'
import { useLocale, useTranslations } from 'next-intl'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

interface InvestmentFormProps {
  reserveCategories: Category[]
  walletCategories: Category[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  /** When provided, hides the date input and uses this value (for day selector card) */
  dateValue?: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('forms')
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t('buttons.saving') : t('buttons.addContribution')}
    </Button>
  )
}

export function InvestmentForm({ reserveCategories, walletCategories, action, dateValue }: InvestmentFormProps) {
  const tLabels = useTranslations('forms.labels')
  const tPlaceholders = useTranslations('forms.placeholders')
  const tInvestment = useTranslations('forms.investment')
  const tTransaction = useTranslations('forms.transaction')
  const locale = useLocale() as AppLocale
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      const form = document.getElementById('investment-form') as HTMLFormElement | null
      if (form) {
        form.reset()
        const dateInput = form.querySelector<HTMLInputElement>('[name="date"]')
        if (dateInput) dateInput.value = dateValue ?? today
      }
    }
  }

  return (
    <form
      id="investment-form"
      action={handleSubmit}
      className="space-y-4 p-4 rounded-lg border bg-card"
    >
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="space-y-2">
          <Label htmlFor="reserveCategoryId">{tLabels('reserve')}</Label>
          <Select id="reserveCategoryId" name="reserveCategoryId" required>
            <option value="">{tInvestment('selectReserve')}</option>
            {reserveCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizeStoredLabel(cat.name, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="walletCategoryId">{tLabels('wallet')}</Label>
          <Select id="walletCategoryId" name="walletCategoryId" required>
            <option value="">{tInvestment('selectWallet')}</option>
            {walletCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizeStoredLabel(cat.name, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{tLabels('amount')}</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder={tPlaceholders('amount')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="useBalance">{tInvestment('useCash')}</Label>
          <Select id="useBalance" name="useBalance" defaultValue="true">
            <option value="true">{tInvestment('debitCash')}</option>
            <option value="false">{tInvestment('monitorOnly')}</option>
          </Select>
        </div>
        {dateValue == null ? (
          <div className="space-y-2">
            <Label htmlFor="date">{tLabels('date')}</Label>
            <Input id="date" name="date" type="date" defaultValue={today} required />
          </div>
        ) : (
          <input type="hidden" name="date" value={dateValue} />
        )}
        <div className="space-y-2">
          <Label htmlFor="notes">{tLabels('notes')}</Label>
          <Input id="notes" name="notes" type="text" placeholder={tTransaction('optional')} />
        </div>
      </div>
      <SubmitButton />
    </form>
  )
}
