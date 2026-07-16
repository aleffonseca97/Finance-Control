'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { InstallmentPlanKind } from '@/lib/validations'
import {
  createInstallmentPlan,
  deleteInstallmentPlan,
  updateInstallmentPlan,
  type InstallmentPlansPageData,
  type InstallmentPlanRow,
} from '@/app/actions/installment-plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatBRL } from '@/lib/date-utils'
import { MONTHS_SHORT } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Pencil, Plus } from 'lucide-react'

const KIND_LABELS: Record<InstallmentPlanKind, string> = {
  FINANCING_CAR: 'Financiamento (veículo)',
  FINANCING_HOME: 'Financiamento (imóvel)',
  LOAN: 'Empréstimo',
  GENERAL: 'Parcelamento (bens ou serviços)',
}

const KIND_OPTIONS = (Object.keys(KIND_LABELS) as InstallmentPlanKind[]).map((value) => ({
  value,
  label: KIND_LABELS[value],
}))

function kindBadgeClass(kind: string) {
  switch (kind) {
    case 'FINANCING_CAR':
      return 'border-sky-500/35 bg-sky-500/10 text-sky-900 dark:text-sky-100'
    case 'FINANCING_HOME':
      return 'border-violet-500/35 bg-violet-500/10 text-violet-900 dark:text-violet-100'
    case 'LOAN':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100'
    default:
      return 'border-border bg-muted/60 text-foreground'
  }
}

type Props = {
  data: InstallmentPlansPageData
}

export function ParcelamentosContent({ data }: Props) {
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<InstallmentPlanRow | null>(null)
  const [formError, setFormError] = useState('')
  const [editError, setEditError] = useState('')
  const [actionError, setActionError] = useState('')

  const maxMonthIdx = useMemo(() => {
    let idx = -1
    data.monthlyTotals.forEach((v, i) => {
      if (v > 0) idx = i
    })
    return idx
  }, [data.monthlyTotals])

  async function handleCreate(fd: FormData) {
    setFormError('')
    const result = await createInstallmentPlan(fd)
    if (result.error) {
      setFormError(result.error)
      return
    }
    setCreateOpen(false)
    router.refresh()
  }

  async function handleUpdate(fd: FormData) {
    setEditError('')
    const result = await updateInstallmentPlan(fd)
    if (result.error) {
      setEditError(result.error)
      return
    }
    setEditing(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setActionError('')
    const result = await deleteInstallmentPlan(id)
    if (result.error) {
      setActionError(result.error)
      return
    }
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      {actionError ? (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="dashboard-bento-card-hero shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Total previsto no ano</CardTitle>
            <CardDescription>
              Parcelas ainda não pagas com vencimento em {data.year} (soma de todos os itens).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">
              R$ {formatBRL(data.totalRemainingInYear)}
            </p>
          </CardContent>
        </Card>
        <Card className="dashboard-bento-card-muted shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pico mensal no ano</CardTitle>
            <CardDescription>Maior soma de parcelas em um único mês de {data.year}.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">
              R$ {formatBRL(data.peakMonthAmount)}
            </p>
            {maxMonthIdx >= 0 && data.peakMonthAmount > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Em {MONTHS_SHORT[maxMonthIdx]} — planeje liquidez nesse mês.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card className="dashboard-bento-card-muted min-w-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Distribuição por mês</CardTitle>
          <CardDescription>Valores ainda a pagar, mês a mês.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {data.monthlyTotals.map((amount, i) => (
              <div
                key={i}
                className={cn(
                  'flex min-h-[4.25rem] min-w-0 flex-col justify-center rounded-lg border px-3 py-2.5 sm:min-h-[4.5rem] sm:px-3.5 sm:py-3',
                  amount > 0 ? 'border-primary/25 bg-primary/5' : 'border-border/60 bg-muted/30',
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:text-[0.8125rem]">
                  {MONTHS_SHORT[i]}
                </p>
                <p className="mt-1 min-w-0 break-words text-sm font-semibold tabular-nums leading-snug sm:text-base">
                  {amount > 0 ? (
                    <>
                      <span className="text-muted-foreground/90">R$ </span>
                      {formatBRL(amount)}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Seus parcelamentos
            </CardTitle>
            <CardDescription>
              Atualize parcelas pagas para refinar o que ainda entra no orçamento de {data.year}.
            </CardDescription>
          </div>
          <Button type="button" onClick={() => setCreateOpen(true)} className="shrink-0 gap-2">
            <Plus className="h-4 w-4" />
            Novo cadastro
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.plans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum parcelamento cadastrado. Use &quot;Novo cadastro&quot; para incluir financiamento,
              empréstimo ou compras parceladas.
            </p>
          ) : (
            <ul className="divide-y rounded-lg border">
              {data.plans.map((row) => (
                <li
                  key={row.id}
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                          kindBadgeClass(row.kind),
                        )}
                      >
                        {KIND_LABELS[row.kind as InstallmentPlanKind] ?? row.kind}
                      </span>
                    </div>
                    <p className="font-semibold leading-snug">{row.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Parcela R$ {formatBRL(row.monthlyAmount)} · {row.paidInstallments}/
                      {row.totalInstallments} pagas
                      {row.remainingInstallments > 0
                        ? ` · ${row.remainingInstallments} restantes`
                        : ' · concluído'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1ª parcela em{' '}
                      {new Date(row.firstInstallmentDate + 'T12:00:00.000Z').toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        No ano {data.year}
                      </p>
                      <p className="text-lg font-semibold tabular-nums">
                        R$ {formatBRL(row.remainingAmountInYear)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.remainingDueInYear === 0
                          ? 'Nenhuma parcela restante neste ano'
                          : row.remainingDueInYear === 1
                            ? '1 parcela prevista'
                            : `${row.remainingDueInYear} parcelas previstas`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground"
                        onClick={() => setEditing(row)}
                        aria-label={`Editar ${row.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <DeleteConfirmButton
                        confirmMessage={`Excluir o parcelamento "${row.name}"?`}
                        onDelete={() => handleDelete(row.id)}
                        ariaLabel={`Excluir ${row.name}`}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen} aria-label="Novo parcelamento">
        <PlanFormDialogBody
          title="Novo parcelamento"
          error={formError}
          submitLabel="Cadastrar"
          onSubmit={handleCreate}
          onClose={() => setCreateOpen(false)}
        />
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} aria-label="Editar parcelamento">
        {editing ? (
          <PlanFormDialogBody
            title="Editar parcelamento"
            error={editError}
            submitLabel="Salvar"
            initial={editing}
            onSubmit={handleUpdate}
            onClose={() => setEditing(null)}
          />
        ) : null}
      </Dialog>
    </div>
  )
}

function PlanFormDialogBody({
  title,
  error,
  submitLabel,
  initial,
  onSubmit,
  onClose,
}: {
  title: string
  error: string
  submitLabel: string
  initial?: InstallmentPlanRow
  onSubmit: (fd: FormData) => Promise<void>
  onClose: () => void
}) {
  return (
    <>
      <DialogHeader onClose={onClose}>{title}</DialogHeader>
      <form
        className="space-y-4"
        action={async (fd) => {
          await onSubmit(fd)
        }}
      >
        {initial ? <input type="hidden" name="id" value={initial.id} /> : null}
        <div className="space-y-2">
          <Label htmlFor="plan-kind">Tipo</Label>
          <Select
            id="plan-kind"
            name="kind"
            required
            defaultValue={initial?.kind ?? 'GENERAL'}
            className="w-full"
          >
            {KIND_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-name">Nome</Label>
          <Input id="plan-name" name="name" required placeholder="Ex.: Financiamento do apartamento" defaultValue={initial?.name} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plan-amount">Valor da parcela (R$)</Label>
            <Input
              id="plan-amount"
              name="monthlyAmount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              required
              defaultValue={initial?.monthlyAmount ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-first">Data da 1ª parcela</Label>
            <Input
              id="plan-first"
              name="firstInstallmentDate"
              type="date"
              required
              defaultValue={initial?.firstInstallmentDate ?? ''}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="plan-total">Total de parcelas</Label>
            <Input
              id="plan-total"
              name="totalInstallments"
              type="number"
              inputMode="numeric"
              min={1}
              required
              defaultValue={initial?.totalInstallments ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-paid">Parcelas já pagas</Label>
            <Input
              id="plan-paid"
              name="paidInstallments"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={initial?.paidInstallments ?? 0}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="plan-notes">Observações (opcional)</Label>
          <textarea
            id="plan-notes"
            name="notes"
            rows={3}
            defaultValue={initial?.notes ?? ''}
            className={cn(
              'flex min-h-[4.5rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </form>
    </>
  )
}
