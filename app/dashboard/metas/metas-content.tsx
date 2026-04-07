'use client'

import { useEffect, useState } from 'react'
import { useFormStatus } from 'react-dom'
import type { Category } from '@prisma/client'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { GoalsPieChart } from '@/components/charts/goals-pie-chart'
import { formatBRL } from '@/lib/date-utils'
import { Select } from '@/components/ui/select'
import type { GoalWithReserveProgress } from '@/app/actions/goals'

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
  return <Button type="submit" disabled={pending}>{pending ? 'Salvando...' : 'Cadastrar meta'}</Button>
}

function ReserveSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? 'Criando...' : 'Criar reserva'}
    </Button>
  )
}

function UpdateAccumulatedSubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="secondary" className="w-full sm:w-auto" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar acumulado'}
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
    setReserveSuccess('Reserva criada com sucesso.')
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
    const confirmed = window.confirm('Deseja realmente excluir esta meta?')
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
    setUpdateAmountSuccess('Valor acumulado atualizado.')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <Card className="dashboard-bento-card shadow-md">
        <CardHeader className="px-4 pt-4 sm:px-6 sm:pt-5">
          <CardTitle className="text-base sm:text-lg">Cadastrar nova meta</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          <form id="goals-form" action={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4">
            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="name">Nome da meta</Label>
                <Input id="name" name="name" placeholder="Ex.: Viagem, casa, reserva..." required />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="reserveCategoryId">Reserva vinculada</Label>
                <Select
                  id="reserveCategoryId"
                  name="reserveCategoryId"
                  value={selectedReserveId}
                  onChange={(event) => setSelectedReserveId(event.target.value)}
                >
                  <option value="">Sem reserva vinculada</option>
                  {reserveOptions.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="targetAmount">Valor alvo (R$)</Label>
                <Input id="targetAmount" name="targetAmount" type="number" min="0" step="0.01" required />
              </div>
              <div className="space-y-2 sm:col-span-1">
                <Label htmlFor="deadline">Prazo</Label>
                <Input id="deadline" name="deadline" type="date" min={today} />
              </div>
            </div>
            <SubmitButton />
          </form>
          <form id="reserve-form" action={handleCreateReserve} className="mt-4 space-y-3 rounded-lg border border-dashed bg-background p-4">
            <p className="text-sm text-muted-foreground">Nao encontrou a reserva? Crie uma nova sem sair desta tela.</p>
            {reserveError ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{reserveError}</div>
            ) : null}
            {reserveSuccess ? (
              <div className="rounded-md bg-emerald-600/10 p-3 text-sm text-emerald-700">{reserveSuccess}</div>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <Label htmlFor="reserveName">Nome da reserva</Label>
                <Input id="reserveName" name="reserveName" placeholder="Ex.: Reserva de emergencia" required />
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
              Você ainda não possui metas cadastradas.
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
                      Excluir
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
                  <GoalsPieChart achieved={achieved} remaining={remaining} />
                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">Reserva vinculada: {goal.reserveCategoryName}</p>
                    <p className="font-medium">
                      Acumulado: <span className="text-emerald-600">R$ {formatBRL(achieved)}</span> de R$ {formatBRL(goal.targetAmount)}
                    </p>
                    <p className="text-muted-foreground">
                      Progresso: {progress.toFixed(1)}% | Prazo:{' '}
                      {deadline ? deadline.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : 'Sem prazo'}
                    </p>
                    {remaining <= 0 ? (
                      <p className="font-medium text-emerald-600">Meta atingida. Parabéns!</p>
                    ) : isExpired ? (
                      <p className="font-medium text-destructive">Prazo vencido. Faltam R$ {formatBRL(remaining)} para concluir.</p>
                    ) : !deadline ? (
                      <p className="font-medium text-blue-600">Meta sem prazo definido. Faltam R$ {formatBRL(remaining)} para concluir.</p>
                    ) : (
                      <p className="font-medium text-blue-600">
                        Você precisa guardar R$ {formatBRL(monthlyAmount)} por mês para chegar no valor até{' '}
                        {deadline.toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })}.
                      </p>
                    )}
                    {!goal.reserveCategoryId ? (
                      <form action={(formData) => handleUpdateCurrentAmount(goal.id, formData)} className="mt-3 space-y-2 rounded-md border bg-background p-3">
                        <p className="text-xs text-muted-foreground">
                          Como esta meta não possui reserva vinculada, atualize o acumulado manualmente.
                        </p>
                        <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                          <div className="space-y-1">
                            <Label htmlFor={`currentAmount-${goal.id}`}>Valor acumulado (R$)</Label>
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
