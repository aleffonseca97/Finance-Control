'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import {
  createIncome,
  updateTransaction,
  updateTransactionDescription,
  deleteTransaction,
} from '@/app/actions/transactions'

type Category = { id: string; name: string }
type Transaction = {
  id: string
  categoryId: string
  amount: number
  description: string | null
  date: Date
  category: { name: string }
}

type Props = {
  categories: Category[]
  transactionsByDay: Record<number, Transaction>
  daysInMonth: number
  month: number
  year: number
}

export function EntradasTable({
  categories,
  transactionsByDay,
  daysInMonth,
  month,
  year,
}: Props) {
  const router = useRouter()
  const [descModal, setDescModal] = useState<{
    open: boolean
    day: number
    transactionId: string | null
    description: string
    dateStr: string
  } | null>(null)

  async function handleSaveRow(
    day: number,
    categoryId: string,
    amount: string,
    existingId: string | null
  ) {
    const numAmount = parseFloat(amount.replace(',', '.')) || 0

    if (existingId) {
      if (numAmount <= 0) {
        await deleteTransaction(existingId)
      } else if (categoryId) {
        await updateTransaction(existingId, {
          categoryId,
          amount: numAmount,
        })
      }
    } else if (numAmount > 0 && categoryId) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const formData = new FormData()
      formData.set('categoryId', categoryId)
      formData.set('amount', String(numAmount))
      formData.set('date', dateStr)
      formData.set(
        'description',
        `Receita dia ${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}/${year}`
      )
      await createIncome(formData)
    }

    router.refresh()
  }

  async function handleSaveDescription(
    transactionId: string | null,
    description: string
  ) {
    if (transactionId) {
      await updateTransactionDescription(transactionId, description.trim() || null)
      setDescModal(null)
      router.refresh()
    }
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <div className="grid grid-cols-[minmax(70px,90px),minmax(120px,1fr),minmax(100px,150px),minmax(90px,auto)] gap-2 sm:gap-4 md:gap-6 border-b bg-muted px-3 sm:px-4 py-2 text-xs font-medium uppercase text-muted-foreground min-w-[400px]">
          <div>Dia</div>
          <div>Categoria</div>
          <div>Valor</div>
          <div className="text-right">Descrição</div>
        </div>
        <div className="divide-y">
          {Array.from({ length: daysInMonth }, (_, index) => {
            const day = index + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const existing = transactionsByDay[day]

                return (
                  <EntradasRow
                    key={`${day}-${existing?.id ?? 'new'}`}
                    day={day}
                    month={month}
                    year={year}
                    dateStr={dateStr}
                    categories={categories}
                    existing={existing}
                    hasEntry={!!existing}
                onSave={handleSaveRow}
                onOpenDesc={() =>
                  setDescModal({
                    open: true,
                    day,
                    transactionId: existing?.id ?? null,
                    description: existing?.description ?? '',
                    dateStr,
                  })
                }
                onDelete={
                  existing
                    ? async () => {
                        await deleteTransaction(existing.id)
                        router.refresh()
                      }
                    : undefined
                }
              />
            )
          })}
        </div>
      </div>

      {descModal && (
        <DescriptionModal
          open={descModal.open}
          description={descModal.description}
          hasTransaction={!!descModal.transactionId}
          onClose={() => setDescModal(null)}
          onSave={(desc) => handleSaveDescription(descModal.transactionId, desc)}
        />
      )}
    </>
  )
}

function EntradasRow({
  day,
  month,
  year,
  dateStr,
  categories,
  existing,
  hasEntry,
  onSave,
  onOpenDesc,
  onDelete,
}: {
  day: number
  month: number
  year: number
  dateStr: string
  categories: { id: string; name: string }[]
  existing: Transaction | undefined
  hasEntry: boolean
  onSave: (day: number, categoryId: string, amount: string, existingId: string | null) => Promise<void>
  onOpenDesc: () => void
  onDelete?: () => void
}) {
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? '')
  const [amount, setAmount] = useState(
    existing?.amount != null ? String(existing.amount) : ''
  )
  const [pending, setPending] = useState(false)

  async function handleBlur() {
    if (pending) return
    setPending(true)
    await onSave(day, categoryId, amount, existing?.id ?? null)
    setPending(false)
  }

  return (
    <div
      className={`grid grid-cols-[minmax(70px,90px),minmax(120px,1fr),minmax(100px,150px),minmax(90px,auto)] items-center gap-2 sm:gap-4 md:gap-6 px-3 sm:px-4 py-3 min-w-[400px] transition-colors ${
        hasEntry
          ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500'
          : ''
      }`}
    >
      <div className="text-sm text-muted-foreground">
        {String(day).padStart(2, '0')}/{String(month + 1).padStart(2, '0')}
      </div>
      <div>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          onBlur={handleBlur}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Selecione</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Input
          type="text"
          inputMode="decimal"
          placeholder="0,00"
          className="text-right"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onBlur={handleBlur}
        />
      </div>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenDesc}
          className="gap-1.5"
        >
          <FileText className="h-4 w-4" />
          Descrição
        </Button>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={async () => {
              if (confirm('Excluir esta transação?')) await onDelete()
            }}
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

function DescriptionModal({
  open,
  description,
  hasTransaction,
  onClose,
  onSave,
}: {
  open: boolean
  description: string
  hasTransaction: boolean
  onClose: () => void
  onSave: (description: string) => Promise<void>
}) {
  const [value, setValue] = useState(description)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (open) setValue(description)
  }, [open, description])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogHeader onClose={onClose}>Descrição</DialogHeader>
      <div className="space-y-4">
        {!hasTransaction ? (
          <p className="text-sm text-muted-foreground">
            Preencha a categoria e o valor primeiro para salvar a entrada, depois você poderá editar a descrição.
          </p>
        ) : (
          <>
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Digite a descrição..."
              className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                disabled={pending}
                onClick={async () => {
                  setPending(true)
                  await onSave(value)
                  setPending(false)
                }}
              >
                Salvar
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
}
