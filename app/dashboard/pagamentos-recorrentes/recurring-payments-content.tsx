'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@prisma/client'
import {
  createRecurringPayment,
  deleteRecurringPayment,
  markRecurringPaymentPaid,
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
import { formatBRL } from '@/lib/date-utils'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

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
  const [modalOpen, setModalOpen] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isPending, startTransition] = useTransition()
  const [optimisticPaid, setOptimisticPaid] = useState<Record<string, boolean>>({})

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

  const categoryGroups = useMemo(() => {
    return Array.from(
      new Set(categories.map((c) => c.group?.trim() || 'Geral')),
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [categories])

  const categoriesByGroup = useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const cat of categories) {
      const g = cat.group?.trim() || 'Geral'
      const list = map.get(g) ?? []
      list.push(cat)
      map.set(g, list)
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    }
    return map
  }, [categories])

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
            Contas recorrentes: R$ {formatBRL(totalRecurring)} · Entradas no mês:
            R$ {formatBRL(totalIncome)}
          </p>
        )}
      </div>

      {actionError && (
        <p className="text-sm text-destructive" role="alert">
          {actionError}
        </p>
      )}

      <p className="text-sm leading-relaxed text-muted-foreground">
        Este controle é independente das despesas fixas que o sistema lança
        automaticamente em <span className="font-medium text-foreground">Saídas</span>.
        Evite cadastrar a mesma conta duas vezes para não duplicar valores.
      </p>

      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle className="text-lg">Contas do mês</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Total a provisionar:{' '}
              <span className="font-semibold tabular-nums text-foreground">
                R$ {formatBRL(totalRecurring)}
              </span>
            </p>
          </div>
          <Button
            type="button"
            className="w-full shrink-0 touch-manipulation sm:w-auto"
            onClick={() => {
              setFormError('')
              setModalOpen(true)
            }}
          >
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Adicionar conta
          </Button>
        </CardHeader>
        <CardContent className="px-0 pb-4 pt-0 sm:px-6 sm:pb-6">
          {rows.length === 0 ? (
            <p className="px-4 text-sm text-muted-foreground sm:px-0">
              Nenhuma conta recorrente cadastrada. Use &quot;Adicionar conta&quot; para
              incluir itens que se repetem todo mês.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/80 text-muted-foreground">
                      <th className="px-4 py-3 font-medium sm:px-0">Categoria</th>
                      <th className="px-4 py-3 font-medium">Categoria principal</th>
                      <th className="px-4 py-3 font-medium text-right">Valor</th>
                      <th className="w-24 px-4 py-3 text-center font-medium">Pago</th>
                      <th className="w-12 px-2 py-3" aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-border/60 last:border-0"
                      >
                        <td className="px-4 py-3 font-medium sm:px-0">
                          {row.categoryName}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {row.categoryGroup?.trim() || '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-red-600 dark:text-red-400">
                          R$ {formatBRL(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <label className="inline-flex cursor-pointer items-center justify-center gap-2">
                            <input
                              type="checkbox"
                              checked={displayPaid(row)}
                              disabled={displayPaid(row) || isPending}
                              onChange={(e) =>
                                handlePaidChange(
                                  row.id,
                                  e.target.checked,
                                  displayPaid(row),
                                )
                              }
                              className="h-4 w-4 rounded border-input accent-primary"
                              aria-label={`Marcar ${row.categoryName} como pago`}
                            />
                          </label>
                        </td>
                        <td className="px-2 py-3 text-right">
                          <DeleteConfirmButton
                            confirmMessage="Excluir esta conta recorrente? As ocorrências dos meses também serão removidas."
                            onDelete={() => handleDelete(row.id)}
                            ariaLabel={`Excluir ${row.categoryName}`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border/60 md:hidden">
                {rows.map((row) => (
                  <li key={row.id} className="px-4 py-4 sm:px-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium leading-snug">{row.categoryName}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {row.categoryGroup?.trim() || 'Sem categoria principal'}
                        </p>
                        <p className="mt-2 text-lg font-semibold tabular-nums text-red-600 dark:text-red-400">
                          R$ {formatBRL(row.amount)}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <label className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Pago</span>
                          <input
                            type="checkbox"
                            checked={displayPaid(row)}
                            disabled={displayPaid(row) || isPending}
                            onChange={(e) =>
                              handlePaidChange(
                                row.id,
                                e.target.checked,
                                displayPaid(row),
                              )
                            }
                            className="h-5 w-5 rounded border-input accent-primary"
                            aria-label={`Marcar ${row.categoryName} como pago`}
                          />
                        </label>
                        <DeleteConfirmButton
                          confirmMessage="Excluir esta conta recorrente?"
                          onDelete={() => handleDelete(row.id)}
                          ariaLabel={`Excluir ${row.categoryName}`}
                        />
                      </div>
                    </div>
                  </li>
                ))}
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
          Nova conta recorrente
        </DialogHeader>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Cadastre categorias de despesa em Configurações antes de adicionar contas
            aqui.
          </p>
        ) : (
          <form
            action={handleAdd}
            className="space-y-4 pt-1"
          >
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />
            <div className="space-y-2">
              <Label htmlFor="recurring-category">Categoria</Label>
              <Select
                id="recurring-category"
                name="categoryId"
                required
                className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                defaultValue=""
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {categoryGroups.map((group) => {
                  const groupCats = categoriesByGroup.get(group) ?? []
                  return (
                    <optgroup key={group} label={group}>
                      {groupCats.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </optgroup>
                  )
                })}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">Valor (mensal)</Label>
              <Input
                id="recurring-amount"
                name="amount"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                className="min-h-11 text-base sm:min-h-10 sm:text-sm"
              />
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
                Cancelar
              </Button>
              <Button type="submit" className="w-full touch-manipulation sm:w-auto">
                Salvar
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
