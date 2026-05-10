'use client'

import { useState, useTransition } from 'react'
import type { Category } from '@prisma/client'
import { useRouter } from 'next/navigation'
import {
  createRecurringInvestment,
  deleteRecurringInvestment,
  markRecurringInvestmentApplied,
  type RecurringInvestmentRow,
} from '@/app/actions/recurring-investments'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { formatBRL } from '@/lib/date-utils'

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
        Para percentuais, o valor aplicado considera apenas as entradas do mês.
      </p>
      <Card className="dashboard-bento-card min-w-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold tracking-tight sm:text-xl">
              Aportes automáticos por mês
            </CardTitle>
            <CardDescription className="mt-1.5">
              Defina transferências recorrentes da reserva para a carteira; valores
              fixos ou percentuais sobre as entradas do mês.
            </CardDescription>
            <p className="mt-2 text-sm text-muted-foreground">
              Total previsto no mês:{' '}
              <span className="font-semibold text-foreground">R$ {formatBRL(totalRecurring)}</span>
            </p>
          </div>
          <Button type="button" onClick={() => setModalOpen(true)}>
            Adicionar recorrência
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhum investimento recorrente cadastrado.
            </p>
          ) : (
            rows.map((row) => (
              <div key={row.id} className="rounded-lg border p-3 sm:p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {row.reserveName} → {row.walletName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {row.amountType === 'percentage'
                        ? `${row.percentage?.toFixed(2)}% das entradas do mês`
                        : 'Valor fixo mensal'}
                    </p>
                  </div>
                  <p className="font-semibold text-blue-500">R$ {formatBRL(row.amount)}</p>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={row.applied || isPending}
                    onClick={() => handleApply(row.id)}
                  >
                    {row.applied ? 'Aplicado' : 'Aplicar no mês'}
                  </Button>
                  <DeleteConfirmButton
                    confirmMessage="Excluir este investimento recorrente?"
                    onDelete={() => handleDelete(row.id)}
                    ariaLabel="Excluir recorrência de investimento"
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
          Novo investimento recorrente
        </DialogHeader>
        <form action={handleCreate} className="space-y-4 pt-1">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="year" value={year} />
          <div className="space-y-2">
            <Label htmlFor="reserveCategoryId">Reserva</Label>
            <Select id="reserveCategoryId" name="reserveCategoryId" required defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              {reserveCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="walletCategoryId">Carteira</Label>
            <Select id="walletCategoryId" name="walletCategoryId" required defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              {walletCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amountType">Tipo de cálculo</Label>
            <Select
              id="amountType"
              name="amountType"
              value={amountType}
              onChange={(e) => setAmountType(e.target.value as 'fixed' | 'percentage')}
            >
              <option value="fixed">Valor fixo</option>
              <option value="percentage">Percentual das entradas do mês</option>
            </Select>
          </div>
          {amountType === 'fixed' ? (
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
              <input type="hidden" name="percentage" value="" />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="percentage">Percentual (%)</Label>
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
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Dialog>
    </div>
  )
}
