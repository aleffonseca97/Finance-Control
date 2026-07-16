'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Category } from '@prisma/client'
import { cn } from '@/lib/utils'
import { compareLocale, formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

interface CreditCard {
  id: string
  name: string
  lastFour: string | null
  limit: number
  color: string | null
}

interface TransactionFormProps {
  type: 'income' | 'expense'
  categories: Category[]
  creditCards?: CreditCard[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  dateValue?: string
  className?: string
}

function SubmitButton({ type }: { type: 'income' | 'expense' }) {
  const { pending } = useFormStatus()
  const t = useTranslations('forms.buttons')
  return (
    <Button
      type="submit"
      disabled={pending}
      className="min-h-11 w-full touch-manipulation sm:min-h-10 sm:w-auto"
    >
      {pending
        ? t('saving')
        : type === 'income'
          ? t('addIncome')
          : t('addExpense')}
    </Button>
  )
}

export function TransactionForm({
  type,
  categories,
  creditCards = [],
  action,
  dateValue,
  className,
}: TransactionFormProps) {
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const t = useTranslations('forms')
  const [error, setError] = useState('')
  const generalGroup = t('generalGroup')
  const initialGroup =
    categories
      .map((c) => c.group?.trim())
      .find((group): group is string => Boolean(group)) ?? generalGroup
  const [selectedGroup, setSelectedGroup] = useState(initialGroup)
  const today = new Date().toISOString().slice(0, 10)
  const groups = Array.from(
    new Set(categories.map((c) => c.group?.trim() || generalGroup)),
  ).sort((a, b) => compareLocale(a, b, locale))
  const filteredCategories = categories.filter(
    (cat) => (cat.group?.trim() || generalGroup) === selectedGroup,
  )

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (type !== 'expense') return
    const categoryId = e.target.value
    const category = categories.find((c) => c.id === categoryId)
    const amountInput = document.getElementById('amount') as HTMLInputElement | null
    const defVal = category && 'defaultValue' in category ? (category as { defaultValue?: number | null }).defaultValue : null
    if (defVal != null && amountInput) {
      amountInput.value = String(defVal)
    }
  }

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      const form = document.getElementById('transaction-form') as HTMLFormElement | null
      if (form) {
        form.reset()
        setSelectedGroup(initialGroup)
        const dateInput = form.querySelector<HTMLInputElement>('[name="date"]')
        if (dateInput) dateInput.value = dateValue ?? today
      }
    }
  }

  return (
    <form
      id="transaction-form"
      action={handleSubmit}
      className={cn('space-y-4 p-4 rounded-lg border bg-card', className)}
    >
      <input type="hidden" name="type" value={type} />
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="categoryGroup">{t('labels.mainCategory')}</Label>
          <Select
            id="categoryGroup"
            name="categoryGroup"
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
          >
            {groups.map((group) => (
              <option key={group} value={group}>
                {localizeStoredLabel(group, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">{t('labels.category')}</Label>
          <Select
            id="categoryId"
            name="categoryId"
            required
            onChange={handleCategoryChange}
          >
            <option value="">{t('placeholders.select')}</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {localizeStoredLabel(cat.name, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">{t('labels.amount')}</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder={t('placeholders.amount')}
            required
          />
        </div>
        {dateValue == null ? (
          <div className="space-y-2">
            <Label htmlFor="date">{t('labels.date')}</Label>
            <Input id="date" name="date" type="date" defaultValue={today} required />
          </div>
        ) : (
          <input type="hidden" name="date" value={dateValue} />
        )}
        <div className="space-y-2">
          <Label htmlFor="description">{t('labels.description')}</Label>
          <Input id="description" name="description" type="text" placeholder={t('transaction.optional')} />
        </div>
        {type === 'expense' && creditCards.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="creditCardId">{t('paymentMethod.label')}</Label>
            <Select id="creditCardId" name="creditCardId">
              <option value="">{t('paymentMethod.cash')}</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                  {card.lastFour ? ` •••• ${card.lastFour}` : ''} ({formatCurrency(card.limit, locale, currency)} {t('paymentMethod.available')})
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <SubmitButton type={type} />
    </form>
  )
}
