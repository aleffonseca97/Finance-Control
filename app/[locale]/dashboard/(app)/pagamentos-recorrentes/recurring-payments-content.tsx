'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from '@/lib/i18n/navigation'
import type { Category } from '@prisma/client'
import {
  createRecurringPayment,
  deleteRecurringPayment,
  markRecurringPaymentPaid,
  updateRecurringPayment,
  type RecurringHealthInsight,
  type RecurringPaymentRow,
} from '@/app/actions/recurring-payments'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { cn } from '@/lib/utils'
import { Check, Plus } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { compareLocale, formatCurrency, formatNumber } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

const HEALTH_STYLES: Record<
  RecurringHealthInsight['variant'],
  string
> = {
  concern:
    'border-destructive/35 bg-destructive/[0.08] text-foreground dark:bg-destructive/15',
  attention:
    'border-amber-500/40 bg-amber-500/[0.08] text-foreground dark:bg-amber-500/12',
  success:
    'border-emerald-500/40 bg-emerald-500/[0.08] text-foreground dark:bg-emerald-500/12',
  neutral: 'border-border bg-muted/50 text-foreground',
}

type Props = {
  month: number
  year: number
  rows: RecurringPaymentRow[]
  totalRecurring: number
  totalIncome: number
  health: RecurringHealthInsight
  categories: Category[]
}

export function RecurringPaymentsContent({
  month,
  year,
  rows,
  totalRecurring,
  totalIncome,
  health,
  categories,
}: Props) {
  const router = useRouter()
  const t = useTranslations('dashboard.recurringPayments')
  const tShared = useTranslations('dashboard.shared')
  const tForms = useTranslations('forms')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [editError, setEditError] = useState('')
  const [actionError, setActionError] = useState('')
  const [filterQuery, setFilterQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all')
  const [isPending, startTransition] = useTransition()
  const [optimisticPaid, setOptimisticPaid] = useState<Record<string, boolean>>({})
  const [editingRow, setEditingRow] = useState<RecurringPaymentRow | null>(null)
  const [createAmountType, setCreateAmountType] = useState<'fixed' | 'percentage'>('fixed')
  const [editAmountType, setEditAmountType] = useState<'fixed' | 'percentage'>('fixed')

  const rowsKey = useMemo(
    () => rows.map((r) => `${r.id}:${r.paid}`).join('|'),
    [rows],
  )

  useEffect(() => {
    setOptimisticPaid({})
  }, [rowsKey])

  function displayPaid(row: RecurringPaymentRow) {
    return optimisticPaid[row.id] ?? row.paid
  }

  const normalizedFilter = filterQuery.trim().toLocaleLowerCase(locale)
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const paid = displayPaid(row)
      if (filterStatus === 'paid' && !paid) return false
      if (filterStatus === 'pending' && paid) return false
      if (!normalizedFilter) return true
      const haystack = `${row.categoryName} ${row.categoryGroup ?? ''}`.toLocaleLowerCase(locale)
      return haystack.includes(normalizedFilter)
    })
  }, [rows, filterStatus, normalizedFilter, optimisticPaid])

  const categoryGroups = useMemo(() => {
    return Array.from(
      new Set(categories.map((c) => c.group?.trim() || tForms('generalGroup'))),
    ).sort((a, b) => compareLocale(a, b, locale))
  }, [categories, locale, tForms])

  const categoriesByGroup = useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const cat of categories) {
      const g = cat.group?.trim() || tForms('generalGroup')
      const list = map.get(g) ?? []
      list.push(cat)
      map.set(g, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => compareLocale(a.name, b.name, locale))
    }
    return map
  }, [categories, locale, tForms])

  async function handleAdd(formData: FormData) {
    setFormError('')
    const result = await createRecurringPayment(formData)
    if (result.error) {
      setFormError(result.error)
      return
    }
    setModalOpen(false)
    router.refresh()
  }

  function handlePaidChange(id: string, nextChecked: boolean, wasPaid: boolean) {
    if (!nextChecked || wasPaid) return
    setActionError('')
    setOptimisticPaid((prev) => ({ ...prev, [id]: true }))
    startTransition(async () => {
      const result = await markRecurringPaymentPaid(id, month, year)
      if (result.error) {
        setOptimisticPaid((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setActionError(result.error)
        return
      }
      router.refresh()
    })
  }

  async function handleDelete(id: string) {
    setActionError('')
    const result = await deleteRecurringPayment(id)
    if (result.error) {
      setActionError(result.error)
      return
    }
    router.refresh()
  }

  async function handleEdit(formData: FormData) {
    setEditError('')
    const result = await updateRecurringPayment(formData)
    if (result.error) {
      setEditError(result.error)
      return
    }
    setEditingRow(null)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'rounded-xl border px-4 py-3 text-sm leading-relaxed sm:px-5 sm:py-4 sm:text-base',
          HEALTH_STYLES[health.variant],
        )}
        role="status"
      >
        <p>{health.message}</p>
        {totalIncome > 0 && (
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            {tShared('recurringPaymentsTotals', {
              recurring: formatCurrency(totalRecurring, locale, currency),
              income: formatCurrency(totalIncome, locale, currency),
            })}
          </p>
        )}
      </div>

      {actionError && (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        {tShared('recurringPaymentsNote')}
      </p>

      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg">{t('monthAccounts')}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {tShared('provisionTotal')}{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(totalRecurring, locale, currency)}
              </span>
            </p>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 touch-manipulation sm:w-auto"
            onClick={() => {
              setFormError('')
              setCreateAmountType('fixed')
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {t('addAccount')}
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-0 sm:px-6 sm:pb-6">
          {rows.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground sm:px-0">
              {tShared('recurringPaymentsEmpty')}
            </p>
          ) : (
            <>
              <div className="mb-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:px-0">
                <div className="w-full space-y-2">
                  <Label htmlFor="recurring-filter">{t('filterCategory')}</Label>
                  <Input
                    id="recurring-filter"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder={t('filterPlaceholder')}
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                </div>
                <div className="w-full space-y-2 sm:w-56">
                  <Label htmlFor="recurring-status-filter">{t('filterStatus')}</Label>
                  <Select
                    id="recurring-status-filter"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as 'all' | 'paid' | 'pending')
                    }
                    className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                  >
                    <option value="all">{t('statusAll')}</option>
                    <option value="pending">{t('statusPending')}</option>
                    <option value="paid">{t('statusPaid')}</option>
                  </Select>
                </div>
              </div>

              {filteredRows.length === 0 && (
                <p className="mb-4 px-4 text-sm text-muted-foreground sm:px-0">
                  {tShared('recurringPaymentsNoFilter')}
                </p>
              )}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground">
                      <th className="px-4 py-3 font-medium sm:px-0">{t('category')}</th>
                      <th className="px-4 py-3 font-medium">{t('mainCategory')}</th>
                      <th className="px-4 py-3 font-medium text-right">{t('amount')}</th>
                      <th className="w-24 px-4 py-3 text-center font-medium">{t('paid')}</th>
                      <th className="w-12 px-2 py-3" aria-label={t('actions')} />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => {
                      const paid = displayPaid(row)
                      return (
                        <tr
                          key={row.id}
                          className={cn(
                            'border-b border-border/60 last:border-0 transition-colors duration-200',
                            paid &&
                              'bg-emerald-500/[0.07] dark:bg-emerald-500/10',
                          )}
                        >
                          <td
                            className={cn(
                              'px-4 py-3 font-medium sm:px-0',
                              paid && 'text-muted-foreground',
                            )}
                          >
                            <span className="inline-flex items-center gap-2">
                              {paid && (
                                <span
                                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                  aria-hidden
                                >
                                  <Check className="h-3 w-3" strokeWidth={2.5} />
                                </span>
                              )}
                              {localizeStoredLabel(row.categoryName, locale)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {localizeStoredLabel(row.categoryGroup, locale) || '—'}
                          </td>
                          <td
                            className={cn(
                              'px-4 py-3 text-right font-semibold tabular-nums',
                              paid
                                ? 'text-emerald-700 line-through decoration-emerald-700/40 dark:text-emerald-400 dark:decoration-emerald-400/40'
                                : 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {formatCurrency(row.amount, locale, currency)}
                            {row.amountType === 'percentage' && (
                              <span className="ml-2 text-xs font-normal text-muted-foreground no-underline">
                                ({formatNumber(row.percentage ?? 0, locale)}%)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <label
                              className={cn(
                                'inline-flex cursor-pointer items-center justify-center gap-2 rounded-md px-2 py-1.5 transition-colors',
                                paid
                                  ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                  : 'hover:bg-muted/60',
                                (paid || isPending) && 'cursor-default',
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={paid}
                                disabled={paid || isPending}
                                onChange={(e) =>
                                  handlePaidChange(row.id, e.target.checked, paid)
                                }
                                className="h-4 w-4 rounded border-input accent-emerald-600"
                                aria-label={t('markPaid', {
                                  name: localizeStoredLabel(row.categoryName, locale),
                                })}
                              />
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  paid ? 'text-emerald-800 dark:text-emerald-300' : 'sr-only',
                                )}
                              >
                                {t('paid')}
                              </span>
                            </label>
                          </td>
                          <td className="px-2 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                className="h-8 px-2 text-xs"
                                onClick={() => {
                                  setEditError('')
                                  setEditAmountType(row.amountType)
                                  setEditingRow(row)
                                }}
                              >
                                {tForms('buttons.edit')}
                              </Button>
                              <DeleteConfirmButton
                                confirmMessage={t('deleteConfirm')}
                                onDelete={() => handleDelete(row.id)}
                                ariaLabel={t('deleteAria', {
                                  name: localizeStoredLabel(row.categoryName, locale),
                                })}
                              />
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border/60 md:hidden">
                {filteredRows.map((row) => {
                  const paid = displayPaid(row)
                  return (
                    <li
                      key={row.id}
                      className={cn(
                        'px-4 py-4 transition-colors duration-200 sm:px-6',
                        paid && 'bg-emerald-500/[0.07] dark:bg-emerald-500/10',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={cn(
                              'flex items-center gap-2 font-medium leading-snug',
                              paid && 'text-muted-foreground',
                            )}
                          >
                            {paid && (
                              <span
                                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                                aria-hidden
                              >
                                <Check className="h-3 w-3" strokeWidth={2.5} />
                              </span>
                            )}
                            {localizeStoredLabel(row.categoryName, locale)}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {localizeStoredLabel(row.categoryGroup, locale) ||
                              t('noMainCategory')}
                          </p>
                          <p
                            className={cn(
                              'mt-2 text-lg font-semibold tabular-nums',
                              paid
                                ? 'text-emerald-700 line-through decoration-emerald-700/40 dark:text-emerald-400 dark:decoration-emerald-400/40'
                                : 'text-red-600 dark:text-red-400',
                            )}
                          >
                            {formatCurrency(row.amount, locale, currency)}
                          </p>
                          {row.amountType === 'percentage' && (
                            <p className="text-xs text-muted-foreground">
                              {formatNumber(row.percentage ?? 0, locale)}%
                            </p>
                          )}
                          {paid && (
                            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
                              {t('paid')}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <label
                            className={cn(
                              'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                              paid
                                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                                : 'text-muted-foreground',
                              (paid || isPending) && 'cursor-default',
                            )}
                          >
                            <span className="font-medium">{t('paid')}</span>
                            <input
                              type="checkbox"
                              checked={paid}
                              disabled={paid || isPending}
                              onChange={(e) =>
                                handlePaidChange(row.id, e.target.checked, paid)
                              }
                              className="h-5 w-5 rounded border-input accent-emerald-600"
                              aria-label={t('markPaid', {
                                name: localizeStoredLabel(row.categoryName, locale),
                              })}
                            />
                          </label>
                          <Button
                            type="button"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => {
                              setEditError('')
                              setEditAmountType(row.amountType)
                              setEditingRow(row)
                            }}
                          >
                            {tForms('buttons.edit')}
                          </Button>
                          <DeleteConfirmButton
                            confirmMessage={t('deleteConfirmShort')}
                            onDelete={() => handleDelete(row.id)}
                            ariaLabel={t('deleteAria', {
                              name: localizeStoredLabel(row.categoryName, locale),
                            })}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setFormError('')
        }}
        className="max-w-md"
      >
        <DialogHeader onClose={() => setModalOpen(false)}>
          {tShared('newRecurringAccount')}
        </DialogHeader>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {tShared('noExpenseCategoriesSettings')}
          </p>
        ) : (
          <form
            action={handleAdd}
            className="space-y-4 pt-1"
          >
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />
            <div className="space-y-2">
              <Label htmlFor="recurring-category">{t('category')}</Label>
              <Select
                id="recurring-category"
                name="categoryId"
                required
                className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  {tForms('placeholders.select')}
                </option>
                {categoryGroups.map((group) => {
                  const groupCats = categoriesByGroup.get(group) ?? []
                  return (
                    <optgroup key={group} label={localizeStoredLabel(group, locale)}>
                      {groupCats.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {localizeStoredLabel(cat.name, locale)}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount-type">{tForms('labels.calculationType')}</Label>
              <Select
                id="recurring-amount-type"
                name="amountType"
                value={createAmountType}
                onChange={(e) => setCreateAmountType(e.target.value as 'fixed' | 'percentage')}
              >
                <option value="fixed">{tForms('labels.fixedValue')}</option>
                <option value="percentage">{tForms('labels.percentageOfIncome')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">{tForms('labels.amountMonthly')}</Label>
              {createAmountType === 'fixed' ? (
                <>
                  <Input
                    id="recurring-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={tForms('placeholders.amount')}
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                  <input type="hidden" name="percentage" value="" />
                </>
              ) : (
                <>
                  <Input
                    id="recurring-amount"
                    name="percentage"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max="100"
                    required
                    placeholder={tForms('placeholders.percentage')}
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                  <input type="hidden" name="amount" value="0" />
                </>
              )}
            </div>
            {formError && (
              <p className="text-sm text-destructive" role="alert">
                {formError}
              </p>
            )}
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setModalOpen(false)}
              >
                {tForms('buttons.cancel')}
              </Button>
              <Button type="submit" className="w-full touch-manipulation sm:w-auto">
                {tForms('buttons.save')}
              </Button>
            </div>
          </form>
        )}
      </Dialog>

      <Dialog
        open={editingRow != null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null)
            setEditError('')
          }
        }}
        className="max-w-md"
      >
        <DialogHeader onClose={() => setEditingRow(null)}>
          {tShared('editRecurringAccount')}
        </DialogHeader>
        {editingRow && (
          <form action={handleEdit} className="space-y-4 pt-1">
            <input type="hidden" name="recurringPaymentId" value={editingRow.id} />
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />
            <div className="space-y-2">
              <Label htmlFor="edit-recurring-category">{t('category')}</Label>
              <Select
                id="edit-recurring-category"
                name="categoryId"
                required
                className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                defaultValue={editingRow.categoryId}
              >
                <option value="" disabled>
                  {tForms('placeholders.select')}
                </option>
                {categoryGroups.map((group) => {
                  const groupCats = categoriesByGroup.get(group) ?? []
                  return (
                    <optgroup key={group} label={localizeStoredLabel(group, locale)}>
                      {groupCats.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {localizeStoredLabel(cat.name, locale)}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-recurring-amount-type">{tForms('labels.calculationType')}</Label>
              <Select
                id="edit-recurring-amount-type"
                name="amountType"
                value={editAmountType}
                onChange={(e) => setEditAmountType(e.target.value as 'fixed' | 'percentage')}
              >
                <option value="fixed">{tForms('labels.fixedValue')}</option>
                <option value="percentage">{tForms('labels.percentageOfIncome')}</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-recurring-amount">{tForms('labels.amountMonthly')}</Label>
              {editAmountType === 'fixed' ? (
                <>
                  <Input
                    id="edit-recurring-amount"
                    name="amount"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    required
                    defaultValue={editingRow.amountType === 'fixed' ? editingRow.amount : 0}
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                  <input type="hidden" name="percentage" value="" />
                </>
              ) : (
                <>
                  <Input
                    id="edit-recurring-amount"
                    name="percentage"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0.01"
                    max="100"
                    required
                    defaultValue={editingRow.percentage ?? 0}
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                  <input type="hidden" name="amount" value="0" />
                </>
              )}
            </div>
            {editError && (
              <p className="text-sm text-destructive" role="alert">
                {editError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {tShared('recurringEditNote')}
            </p>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setEditingRow(null)}
              >
                {tForms('buttons.cancel')}
              </Button>
              <Button type="submit" className="w-full touch-manipulation sm:w-auto">
                {tShared('saveChanges')}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
