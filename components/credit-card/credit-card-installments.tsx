'use client'

import { useState } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import {
  createInstallmentPlan,
  updateInstallmentPlan,
  deleteInstallmentPlan,
} from '@/app/actions/installment-plans'
import type {
  CreditCardInstallmentRow,
  CreditCardWithMonthUsage,
} from '@/app/actions/credit-cards'
import { Plus, Pencil } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  const tForms = useTranslations('forms.buttons')
  return (
    <Button type="submit" disabled={pending} className="min-h-10 sm:min-h-9">
      {pending ? tForms('saving') : isEdit ? tForms('save') : tForms('add')}
    </Button>
  )
}

type Props = {
  cards: CreditCardWithMonthUsage[]
  plans: CreditCardInstallmentRow[]
}

export function CreditCardInstallments({ cards, plans }: Props) {
  const t = useTranslations('dashboard.creditCard')
  const tForms = useTranslations('forms')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<CreditCardInstallmentRow | null>(null)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)

  function closeForm() {
    setShowForm(false)
    setEditing(null)
    setError('')
  }

  async function handleSubmit(formData: FormData) {
    setError('')
    formData.set('kind', 'CREDIT_CARD')
    const result = editing
      ? await updateInstallmentPlan(formData)
      : await createInstallmentPlan(formData)
    if (result?.error) {
      setError(result.error)
      return
    }
    closeForm()
    router.refresh()
  }

  async function handleDelete(id: string) {
    const result = await deleteInstallmentPlan(id)
    if (result?.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        {t('installmentsNeedCard')}
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-base sm:text-sm">{t('installmentsTitle')}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{t('installmentsHint')}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto min-h-11 sm:min-h-9"
          onClick={() => {
            setEditing(null)
            setShowForm(!showForm || !!editing)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          {t('newInstallment')}
        </Button>
      </div>

      {(showForm || editing) && (
        <form
          action={handleSubmit}
          className="space-y-4 rounded-lg border bg-muted/30 p-4"
        >
          {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
          {error ? (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="installment-card">{t('installmentCard')}</Label>
              <Select
                id="installment-card"
                name="creditCardId"
                defaultValue={editing?.creditCardId ?? cards[0]?.id}
                required
              >
                {cards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                    {card.lastFour ? ` •••• ${card.lastFour}` : ''}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-1 lg:col-span-2">
              <Label htmlFor="installment-name">{tForms('labels.name')}</Label>
              <Input
                id="installment-name"
                name="name"
                defaultValue={editing?.name}
                placeholder={t('installmentNamePlaceholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyAmount">{t('installmentAmount')}</Label>
              <Input
                id="monthlyAmount"
                name="monthlyAmount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={editing?.monthlyAmount}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">{t('totalInstallments')}</Label>
              <Input
                id="totalInstallments"
                name="totalInstallments"
                type="number"
                min="1"
                step="1"
                defaultValue={editing?.totalInstallments ?? 12}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paidInstallments">{t('paidInstallments')}</Label>
              <Input
                id="paidInstallments"
                name="paidInstallments"
                type="number"
                min="0"
                step="1"
                defaultValue={editing?.paidInstallments ?? 0}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstInstallmentDate">{t('firstInstallmentDate')}</Label>
              <Input
                id="firstInstallmentDate"
                name="firstInstallmentDate"
                type="date"
                defaultValue={editing?.firstInstallmentDate ?? today}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">{tForms('labels.notes')}</Label>
              <Input
                id="notes"
                name="notes"
                defaultValue={editing?.notes ?? ''}
                placeholder={t('installmentNotesPlaceholder')}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <SubmitButton isEdit={!!editing} />
            <Button type="button" variant="outline" onClick={closeForm}>
              {tForms('buttons.cancel')}
            </Button>
          </div>
        </form>
      )}

      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">{t('installmentsEmpty')}</p>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => {
            const progress =
              plan.totalInstallments > 0
                ? (plan.paidInstallments / plan.totalInstallments) * 100
                : 0
            return (
              <li
                key={plan.id}
                className="rounded-xl border bg-card p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{plan.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {plan.creditCardName}
                      {plan.creditCardLastFour
                        ? ` •••• ${plan.creditCardLastFour}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setShowForm(false)
                        setEditing(plan)
                      }}
                      aria-label={tForms('buttons.edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteConfirmButton
                      confirmMessage={t('installmentDeleteConfirm')}
                      onDelete={() => handleDelete(plan.id)}
                    />
                  </div>
                </div>

                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('installmentAmount')}</p>
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(plan.monthlyAmount, locale, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('progress')}</p>
                    <p className="font-semibold tabular-nums">
                      {t('progressCount', {
                        paid: plan.paidInstallments,
                        total: plan.totalInstallments,
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('remaining')}</p>
                    <p className="font-semibold tabular-nums">
                      {formatCurrency(plan.remainingAmount, locale, currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all')}
                    style={{
                      width: `${Math.min(100, progress)}%`,
                      backgroundColor: plan.creditCardColor ?? '#6366f1',
                    }}
                  />
                </div>
                {plan.remainingDueInYear > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {t('remainingInYear', {
                      count: plan.remainingDueInYear,
                      amount: formatCurrency(
                        plan.remainingAmountInYear,
                        locale,
                        currency,
                      ),
                    })}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
