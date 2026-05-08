'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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

  const normalizedFilter = filterQuery.trim().toLocaleLowerCase('pt-BR')
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const paid = displayPaid(row)
      if (filterStatus === 'paid' && !paid) return false
      if (filterStatus === 'pending' && paid) return false
      if (!normalizedFilter) return true
      const haystack = `${row.categoryName} ${row.categoryGroup ?? ''}`.toLocaleLowerCase(
        'pt-BR',
      )
      return haystack.includes(normalizedFilter)
    })
  }, [rows, filterStatus, normalizedFilter, optimisticPaid])

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
        Pagamentos recorrentes e despesas fixas usam a mesma base de dados.
        Alterações feitas aqui também atualizam seus lançamentos fixos.
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
              setCreateAmountType('fixed')
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
              <div className="mb-4 flex flex-col gap-3 px-4 sm:flex-row sm:items-end sm:px-0">
                <div className="w-full space-y-2">
                  <Label htmlFor="recurring-filter">Filtrar por categoria</Label>
                  <Input
                    id="recurring-filter"
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    placeholder="Ex.: aluguel, internet, energia"
                    className="min-h-11 text-base sm:min-h-10 sm:text-sm"
                  />
                </div>
                <div className="w-full space-y-2 sm:w-56">
                  <Label htmlFor="recurring-status-filter">Status</Label>
                  <Select
                    id="recurring-status-filter"
                    value={filterStatus}
                    onChange={(e) =>
                      setFilterStatus(e.target.value as 'all' | 'paid' | 'pending')
                    }
                    className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="pending">Pendentes</option>
                    <option value="paid">Pagos</option>
                  </Select>
                </div>
              </div>

              {filteredRows.length === 0 && (
                <p className="mb-4 px-4 text-sm text-muted-foreground sm:px-0">
                  Nenhum resultado para os filtros selecionados.
                </p>
              )}

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
                    {filteredRows.map((row) => (
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
                          {row.amountType === 'percentage' && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              ({row.percentage?.toFixed(2)}%)
                            </span>
                          )}
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
                              Editar
                            </Button>
                            <DeleteConfirmButton
                              confirmMessage="Excluir esta conta recorrente? As ocorrências dos meses também serão removidas."
                              onDelete={() => handleDelete(row.id)}
                              ariaLabel={`Excluir ${row.categoryName}`}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-border/60 md:hidden">
                {filteredRows.map((row) => (
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
                        {row.amountType === 'percentage' && (
                          <p className="text-xs text-muted-foreground">
                            {row.percentage?.toFixed(2)}% das entradas do mês
                          </p>
                        )}
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
                          Editar
                        </Button>
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
              <Label htmlFor="recurring-amount-type">Tipo de cálculo</Label>
              <Select
                id="recurring-amount-type"
                name="amountType"
                value={createAmountType}
                onChange={(e) => setCreateAmountType(e.target.value as 'fixed' | 'percentage')}
              >
                <option value="fixed">Valor fixo</option>
                <option value="percentage">Percentual das entradas do mês</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurring-amount">Valor (mensal)</Label>
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
                    placeholder="0,00"
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
                    placeholder="Ex.: 10"
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
                Cancelar
              </Button>
              <Button type="submit" className="w-full touch-manipulation sm:w-auto">
                Salvar
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
          Editar conta recorrente
        </DialogHeader>
        {editingRow && (
          <form action={handleEdit} className="space-y-4 pt-1">
            <input type="hidden" name="recurringPaymentId" value={editingRow.id} />
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="year" value={year} />
            <div className="space-y-2">
              <Label htmlFor="edit-recurring-category">Categoria</Label>
              <Select
                id="edit-recurring-category"
                name="categoryId"
                required
                className="min-h-11 w-full text-base sm:min-h-10 sm:text-sm"
                defaultValue={editingRow.categoryId}
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
              <Label htmlFor="edit-recurring-amount-type">Tipo de cálculo</Label>
              <Select
                id="edit-recurring-amount-type"
                name="amountType"
                value={editAmountType}
                onChange={(e) => setEditAmountType(e.target.value as 'fixed' | 'percentage')}
              >
                <option value="fixed">Valor fixo</option>
                <option value="percentage">Percentual das entradas do mês</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-recurring-amount">Valor (mensal)</Label>
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
              Se houver lançamento no mês atual, os valores serão atualizados nele
              também.
            </p>
            <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setEditingRow(null)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full touch-manipulation sm:w-auto">
                Salvar alterações
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  )
}
