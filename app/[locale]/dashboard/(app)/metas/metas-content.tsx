'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Category } from '@prisma/client'
import { useRouter } from '@/lib/i18n/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GoalsPieChart } from '@/components/charts/goals-pie-chart'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import { Select } from '@/components/ui/select'
import type { GoalWithReserveProgress } from '@/app/actions/goals'
import { useLocale, useTranslations } from 'next-intl'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'

type MetasContentProps = {
  goals: GoalWithReserveProgress[]
  reserveCategories: Category[]
  createGoalAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  createReserveAction: (formData: FormData) => Promise<{ error?: string; success?: boolean; reserve?: { id: string; name: string } }>
  updateGoalCurrentAmountAction: (id: string, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  deleteGoalAction: (id: string) => Promise<{ error?: string; success?: boolean }>
}

type ReserveOption = {
  id: string
  name: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('dashboard.goals')
  const tForms = useTranslations('forms.buttons')
  return <Button type="submit" disabled={pending}>{pending ? tForms('saving') : t('createGoal')}</Button>
}

function ReserveSubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('dashboard.goals')
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? t('creatingReserve') : t('createReserve')}
    </Button>
  )
}

function UpdateAccumulatedSubmitButton() {
  const { pending } = useFormStatus()
  const t = useTranslations('dashboard.goals')
  const tForms = useTranslations('forms.buttons')
  return (
    <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={pending}>
      {pending ? tForms('saving') : t('saveAccumulated')}
    </Button>
  )
}

function monthDifference(from: Date, to: Date) {
  const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  return months + 1
}

export function MetasContent({
  goals,
  reserveCategories,
  createGoalAction,
  createReserveAction,
  updateGoalCurrentAmountAction,
  deleteGoalAction,
}: MetasContentProps) {
  const router = useRouter()
  const t = useTranslations('dashboard.goals')
  const tForms = useTranslations('forms')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [reserveOptions, setReserveOptions] = useState<ReserveOption[]>(
    reserveCategories.map((item) => ({ id: item.id, name: item.name }))
  )
  const [selectedReserveId, setSelectedReserveId] = useState('')
  const [error, setError] = useState('')
  const [reserveError, setReserveError] = useState('')
  const [reserveSuccess, setReserveSuccess] = useState('')
  const [updateAmountError, setUpdateAmountError] = useState('')
  const [updateAmountSuccess, setUpdateAmountSuccess] = useState('')
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    setReserveOptions(reserveCategories.map((item) => ({ id: item.id, name: item.name })))
  }, [reserveCategories])

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await createGoalAction(formData)
    if (result?.error) {
      setError(result.error)
      return
    }
    const form = document.getElementById('goals-form') as HTMLFormElement | null
    form?.reset()
    router.refresh()
  }

  async function handleCreateReserve(formData: FormData) {
    setReserveError('')
    setReserveSuccess('')
    const result = await createReserveAction(formData)
    if (result?.error) {
      setReserveError(result.error)
      return
    }
    setReserveSuccess(t('reserveCreated'))
    if (result?.reserve) {
      setReserveOptions((prev) => {
        if (prev.some((item) => item.id === result.reserve?.id)) return prev
        return [...prev, { id: result.reserve.id, name: result.reserve.name }]
      })
      setSelectedReserveId(result.reserve.id)
    }
    const form = document.getElementById('reserve-form') as HTMLFormElement | null
    form?.reset()
    router.refresh()
  }

  const today = new Date().toISOString().slice(0, 10)
  async function handleDelete(goalId: string) {
    setDeleteError('')
    const confirmed = window.confirm(t('deleteConfirm'))
    if (!confirmed) return
    const result = await deleteGoalAction(goalId)
    if (result?.error) setDeleteError(result.error)
  }

  async function handleUpdateCurrentAmount(goalId: string, formData: FormData) {
    setUpdateAmountError('')
    setUpdateAmountSuccess('')
    const result = await updateGoalCurrentAmountAction(goalId, formData)
    if (result?.error) {
      setUpdateAmountError(result.error)
      return
    }
    setUpdateAmountSuccess(t('accumulatedUpdated'))
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-bento-card shadow-md">
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-base sm:text-lg">{t('createTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <form id="goals-form" action={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="name">{tForms('labels.goalName')}</Label>
                <Input id="name" name="name" placeholder={tForms('placeholders.goalName')} required />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="reserveCategoryId">{tForms('labels.reserve')}</Label>
                <Select
                  id="reserveCategoryId"
                  name="reserveCategoryId"
                  value={selectedReserveId}
                  onChange={(event) => setSelectedReserveId(event.target.value)}
                >
                  <option value="">{t('noReserveLinked')}</option>
                  {reserveOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {localizeStoredLabel(cat.name, locale)}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="targetAmount">{tForms('labels.targetAmount')}</Label>
                <Input id="targetAmount" name="targetAmount" type="number" min="0" step="0.01" required />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="deadline">{tForms('labels.deadline')}</Label>
                <Input id="deadline" name="deadline" type="date" min={today} />
              </div>
            </div>
            <SubmitButton />
          </form>
          <form id="reserve-form" action={handleCreateReserve} className="mt-4 space-y-3 rounded-lg border border-dashed bg-background p-4">
            <p className="text-sm text-muted-foreground">{t('reserveNotFound')}</p>
            {reserveError ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{reserveError}</div>
            ) : null}
            {reserveSuccess ? (
              <div className="rounded-md bg-emerald-600/10 p-3 text-sm text-emerald-700">{reserveSuccess}</div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="reserveName">{tForms('labels.reserveName')}</Label>
                <Input id="reserveName" name="reserveName" placeholder={tForms('placeholders.reserveName')} required />
              </div>
              <div className="sm:self-end">
                <ReserveSubmitButton />
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.length === 0 ? (
          <Card className="dashboard-bento-card-muted lg:col-span-2">
            <CardContent className="py-8 text-center text-sm text-muted-foreground sm:text-base">
              {t('noGoals')}
            </CardContent>
          </Card>
        ) : (
          goals.map((goal) => {
            const achieved = Math.min(goal.currentAmount, goal.targetAmount)
            const remaining = Math.max(goal.targetAmount - achieved, 0)
            const progress = goal.targetAmount > 0 ? (achieved / goal.targetAmount) * 100 : 0

            const now = new Date()
            const deadline = goal.deadline ? new Date(goal.deadline) : null
            const hasDeadline = Boolean(deadline)
            const isExpired = hasDeadline && deadline ? deadline < now && remaining > 0 : false
            const monthsLeft = hasDeadline && deadline && !isExpired ? Math.max(1, monthDifference(now, deadline)) : 0
            const monthlyAmount = remaining > 0 && monthsLeft > 0 ? remaining / monthsLeft : 0

            return (
              <Card key={goal.id} className="dashboard-bento-card overflow-hidden shadow-md">
                <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base sm:text-lg">{goal.name}</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleDelete(goal.id)}
                    >
                      {tForms('buttons.delete')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                  <GoalsPieChart achieved={achieved} remaining={remaining} />
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">{t('linkedReserve', { name: goal.reserveCategoryName })}</p>
                    <p className="font-medium">
                      {t('accumulated')} <span className="text-emerald-600">{formatCurrency(achieved, locale, currency)}</span> {t('of')} {formatCurrency(goal.targetAmount, locale, currency)}
                    </p>
                    <p className="text-muted-foreground">
                      {t('progress')} {progress.toFixed(1)}% | {t('deadline')}{' '}
                      {deadline ? deadline.toLocaleDateString(locale, { month: '2-digit', year: 'numeric' }) : t('noDeadline')}
                    </p>
                    {remaining <= 0 ? (
                      <p className="font-medium text-emerald-600">{t('goalReached')}</p>
                    ) : isExpired ? (
                      <p className="font-medium text-destructive">{t('deadlineExpired', { amount: formatCurrency(remaining, locale, currency) })}</p>
                    ) : !deadline ? (
                      <p className="font-medium text-blue-600">{t('noDeadlineRemaining', { amount: formatCurrency(remaining, locale, currency) })}</p>
                    ) : (
                      <p className="font-medium text-blue-600">
                        {t('monthlyNeeded', {
                          amount: formatCurrency(monthlyAmount, locale, currency),
                          deadline: deadline.toLocaleDateString(locale, { month: '2-digit', year: 'numeric' }),
                        })}
                      </p>
                    )}
                    {!goal.reserveCategoryId ? (
                      <form action={(formData) => handleUpdateCurrentAmount(goal.id, formData)} className="mt-3 space-y-2 rounded-md border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          {t('manualAccumulatedHint')}
                        </p>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                          <div className="space-y-1">
                            <Label htmlFor={`currentAmount-${goal.id}`}>{tForms('labels.currentAmount')}</Label>
                            <Input
                              id={`currentAmount-${goal.id}`}
                              name="currentAmount"
                              type="number"
                              min="0"
                              step="0.01"
                              defaultValue={goal.currentAmount.toFixed(2)}
                              required
                            />
                          </div>
                          <UpdateAccumulatedSubmitButton />
                        </div>
                      </form>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      {deleteError ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{deleteError}</div>
      ) : null}
      {updateAmountError ? (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{updateAmountError}</div>
      ) : null}
      {updateAmountSuccess ? (
        <div className="rounded-md bg-emerald-600/10 p-3 text-sm text-emerald-700">{updateAmountSuccess}</div>
      ) : null}
    </div>
  )
}
