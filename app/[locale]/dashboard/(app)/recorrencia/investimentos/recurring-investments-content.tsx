'use client'

import { useState, useTransition } from 'react'
import type { Category } from '@prisma/client'
import { useRouter } from '@/lib/i18n/navigation'
import {
  createRecurringInvestment,
  deleteRecurringInvestment,
  markRecurringInvestmentApplied,
  type RecurringInvestmentRow,
} from '@/app/actions/recurring-investments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatCurrency, formatNumber } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import { useLocale, useTranslations } from 'next-intl'
import type { AppLocale } from '@/i18n/routing'

type Props = {
  month: number
  year: number
  rows: RecurringInvestmentRow[]
  totalRecurring: number
  reserveCategories: Category[]
  walletCategories: Category[]
}

export function RecurringInvestmentsContent({
  month,
  year,
  rows,
  totalRecurring,
  reserveCategories,
  walletCategories,
}: Props) {
  const router = useRouter()
  const t = useTranslations('dashboard.recurringInvestments')
  const tShared = useTranslations('dashboard.shared')
  const tForms = useTranslations('forms')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [modalOpen, setModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [amountType, setAmountType] = useState<'fixed' | 'percentage'>('fixed')
  const [isPending, startTransition] = useTransition()

  async function handleCreate(formData: FormData) {
    setError('')
    const result = await createRecurringInvestment(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    setModalOpen(false)
    router.refresh()
  }

  function handleApply(id: string) {
    setError('')
    startTransition(async () => {
      const result = await markRecurringInvestmentApplied(id, month, year)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    setError('')
    const result = await deleteRecurringInvestment(id)
    if (result.error) {
      setError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        {tShared('recurringInvestmentsHint')}
      </p>
      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{t('recurringContributions')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('monthTotal')}{' '}
              <span className="font-semibold text-foreground">{formatCurrency(totalRecurring, locale, currency)}</span>
            </p>
          </div>
          <Button type="button" onClick={() => setModalOpen(true)}>
            {tShared('addRecurringInvestment')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {tShared('noRecurringInvestments')}
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {localizeStoredLabel(row.reserveName, locale)} →{' '}
                      {localizeStoredLabel(row.walletName, locale)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.amountType === 'percentage'
                        ? t('percentageOfIncome', { percentage: formatNumber(row.percentage ?? 0, locale) })
                        : t('fixedMonthly')}
                    </p>
                  </div>
                  <p className="font-semibold text-blue-500">{formatCurrency(row.amount, locale, currency)}</p>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={row.applied || isPending}
                    onClick={() => handleApply(row.id)}
                  >
                    {row.applied ? t('applied') : t('applyToMonth')}
                  </Button>
                  <DeleteConfirmButton
                    confirmMessage={t('deleteConfirm')}
                    onDelete={() => handleDelete(row.id)}
                    ariaLabel={t('deleteAria')}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setError('')
        }}
        className="max-w-md"
      >
        <DialogHeader onClose={() => setModalOpen(false)}>
          {t('newContribution')}
        </DialogHeader>
        <form action={handleCreate} className="space-y-4 pt-1">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <div className="space-y-2">
            <Label htmlFor="reserveCategoryId">{tForms('labels.reserve')}</Label>
            <Select id="reserveCategoryId" name="reserveCategoryId" required defaultValue="">
              <option value="" disabled>
                {tForms('placeholders.select')}
              </option>
              {reserveCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {localizeStoredLabel(cat.name, locale)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="walletCategoryId">{tForms('labels.wallet')}</Label>
            <Select id="walletCategoryId" name="walletCategoryId" required defaultValue="">
              <option value="" disabled>
                {tForms('placeholders.select')}
              </option>
              {walletCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {localizeStoredLabel(cat.name, locale)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountType">{tForms('labels.calculationType')}</Label>
            <Select
              id="amountType"
              name="amountType"
              value={amountType}
              onChange={(e) => setAmountType(e.target.value as 'fixed' | 'percentage')}
            >
              <option value="fixed">{tForms('labels.fixedValue')}</option>
              <option value="percentage">{tForms('labels.percentageOfIncome')}</option>
            </Select>
          </div>
          {amountType === 'fixed' ? (
            <div className="space-y-2">
              <Label htmlFor="amount">{tForms('labels.amount')}</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              <input type="hidden" name="percentage" value="" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="percentage">{tForms('labels.percentage')}</Label>
              <Input
                id="percentage"
                name="percentage"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                required
              />
              <input type="hidden" name="amount" value="0" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              {tForms('buttons.cancel')}
            </Button>
            <Button type="submit">{tForms('buttons.save')}</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
