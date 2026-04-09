'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Category } from '@prisma/client'
import { updateTransaction } from '@/app/actions/transactions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { DeleteConfirmButton } from '@/components/shared/delete-confirm-button'
import { CategoryIcon } from '@/components/category/category-icon'
import { formatBRL, formatDateBR } from '@/lib/date-utils'

type PaymentFilter = 'all' | 'card' | 'cash'

type TransactionItem = {
  id: string
  categoryId: string
  amount: number
  date: Date | string
  description: string | null
  /** Compra lançada no cartão (usa limite); ausente = saída pelo saldo (à vista ou pagamento de fatura). */
  creditCardId: string | null
  category: { name: string; group: string | null; icon: string; color: string | null }
}

type Props = {
  title: string
  total: number
  items: TransactionItem[]
  categories: Category[]
  emptyMessage: string
  onDelete: (id: string) => Promise<unknown>
  deleteConfirmMessage: string
}

type SortField = 'category' | 'mainCategory' | 'date' | 'amount'
type SortDirection = 'asc' | 'desc'

export function ExpensePeriodTableCard({
  title,
  total,
  items,
  categories,
  emptyMessage,
  onDelete,
  deleteConfirmMessage,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [mainCategory, setMainCategory] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [detailItem, setDetailItem] = useState<TransactionItem | null>(null)
  const [draftCategoryId, setDraftCategoryId] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

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

  useEffect(() => {
    if (detailItem) {
      setDraftCategoryId(detailItem.categoryId)
      setSaveError('')
    }
  }, [detailItem])

  const mainCategories = useMemo(() => {
    const groups = new Set<string>()

    items.forEach((item) => {
      groups.add(item.category.group?.trim() || 'Sem categoria principal')
    })

    return Array.from(groups).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  }, [items])

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase()

    return items.filter((item) => {
      const group = item.category.group?.trim() || 'Sem categoria principal'
      const date = formatDateBR(item.date).toLowerCase()
      const category = item.category.name.toLowerCase()
      const isCard = item.creditCardId != null

      const matchesPayment =
        paymentFilter === 'all' ||
        (paymentFilter === 'card' && isCard) ||
        (paymentFilter === 'cash' && !isCard)

      const matchesMainCategory = mainCategory === 'all' || group === mainCategory
      const matchesSearch =
        term.length === 0 ||
        category.includes(term) ||
        group.toLowerCase().includes(term) ||
        date.includes(term)

      return matchesPayment && matchesMainCategory && matchesSearch
    })
  }, [items, mainCategory, paymentFilter, search])

  const sortedItems = useMemo(() => {
    const cloned = [...filteredItems]

    cloned.sort((a, b) => {
      const groupA = a.category.group?.trim() || 'Sem categoria principal'
      const groupB = b.category.group?.trim() || 'Sem categoria principal'

      let compareValue = 0

      if (sortField === 'category') {
        compareValue = a.category.name.localeCompare(b.category.name, 'pt-BR')
      } else if (sortField === 'mainCategory') {
        compareValue = groupA.localeCompare(groupB, 'pt-BR')
      } else if (sortField === 'date') {
        compareValue = new Date(a.date).getTime() - new Date(b.date).getTime()
      } else {
        compareValue = a.amount - b.amount
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

    return cloned
  }, [filteredItems, sortDirection, sortField])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / itemsPerPage))

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    const end = start + itemsPerPage
    return sortedItems.slice(start, end)
  }, [currentPage, sortedItems])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, mainCategory, paymentFilter, sortField, sortDirection])

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSortField(field)
    setSortDirection(field === 'date' || field === 'amount' ? 'desc' : 'asc')
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return '↕'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  async function handleSaveCategory() {
    if (!detailItem || !draftCategoryId) return
    setSaveError('')
    setSaving(true)
    const result = await updateTransaction(detailItem.id, { categoryId: draftCategoryId })
    setSaving(false)
    if (result?.error) {
      setSaveError(result.error)
      return
    }
    setDetailItem(null)
    router.refresh()
  }

  return (
    <Card className="dashboard-bento-card-muted overflow-hidden shadow-md">
      <CardHeader className="flex flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
        <p className="text-xl font-bold text-red-500 tabular-nums sm:text-2xl">
          R$ {formatBRL(total)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Forma de pagamento
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filtrar por cartão de crédito ou saldo"
          >
            {(
              [
                { value: 'all' as const, label: 'Todas' },
                { value: 'card' as const, label: 'Cartão de crédito' },
                { value: 'cash' as const, label: 'Saldo' },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setPaymentFilter(value)}
                className={`h-9 rounded-md border px-3 text-sm font-medium transition-colors ${
                  paymentFilter === value
                    ? 'border-primary bg-primary/10 text-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_260px_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filtrar por categoria, categoria principal ou data"
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Filtrar lançamentos"
          />
          <select
            value={mainCategory}
            onChange={(event) => setMainCategory(event.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            aria-label="Filtrar por categoria principal"
          >
            <option value="all">Todas as categorias principais</option>
            {mainCategories.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setMainCategory('all')
              setPaymentFilter('all')
            }}
            className="h-10 rounded-md border px-3 text-sm font-medium transition-colors hover:bg-muted"
          >
            Limpar filtros
          </button>
        </div>

        {sortedItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground sm:text-base">
            {emptyMessage}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('category')}
                      className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      Categoria <span aria-hidden>{sortIndicator('category')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('mainCategory')}
                      className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      Categoria principal <span aria-hidden>{sortIndicator('mainCategory')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('date')}
                      className="inline-flex items-center gap-2 transition-colors hover:text-foreground"
                    >
                      Data <span aria-hidden>{sortIndicator('date')}</span>
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    <button
                      type="button"
                      onClick={() => toggleSort('amount')}
                      className="inline-flex items-center justify-end gap-2 transition-colors hover:text-foreground"
                    >
                      Valor <span aria-hidden>{sortIndicator('amount')}</span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedItems.map((item) => {
                  const group = item.category.group?.trim() || 'Sem categoria principal'

                  return (
                    <tr
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      className="cursor-pointer hover:bg-muted/40"
                      onClick={() => setDetailItem(item)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setDetailItem(item)
                        }
                      }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                            style={{
                              backgroundColor: `${item.category.color ?? '#6366f1'}20`,
                            }}
                          >
                            <CategoryIcon
                              icon={item.category.icon}
                              className="h-4 w-4 text-foreground"
                            />
                          </span>
                          <span>{item.category.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{group}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDateBR(item.date)}</td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-end gap-3"
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => e.stopPropagation()}
                        >
                          <span className="font-semibold text-red-500 tabular-nums">
                            R$ {formatBRL(item.amount)}
                          </span>
                          <DeleteConfirmButton
                            confirmMessage={deleteConfirmMessage}
                            onDelete={() => onDelete(item.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>

            <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {paginatedItems.length} de {sortedItems.length} registros
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-9 rounded-md border px-3 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="min-w-24 text-center">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-9 rounded-md border px-3 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <Dialog
        open={detailItem != null}
        onOpenChange={(open) => {
          if (!open) setDetailItem(null)
        }}
        className="max-w-md"
      >
        {detailItem && (
          <>
            <DialogHeader onClose={() => setDetailItem(null)}>Detalhes da saída</DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">Data:</span>{' '}
                  {formatDateBR(detailItem.date)}
                </span>
                <span className="font-semibold text-red-500 tabular-nums">
                  R$ {formatBRL(detailItem.amount)}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Descrição</p>
                <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm leading-relaxed text-foreground">
                  {detailItem.description?.trim()
                    ? detailItem.description
                    : 'Sem descrição'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expense-detail-category">Categoria</Label>
                <Select
                  id="expense-detail-category"
                  value={draftCategoryId}
                  onChange={(e) => setDraftCategoryId(e.target.value)}
                  disabled={categories.length === 0 || saving}
                >
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
              {saveError && (
                <p className="text-sm text-destructive" role="alert">
                  {saveError}
                </p>
              )}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDetailItem(null)}
                  disabled={saving}
                >
                  Fechar
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSaveCategory()}
                  disabled={
                    saving ||
                    categories.length === 0 ||
                    !draftCategoryId ||
                    draftCategoryId === detailItem.categoryId
                  }
                >
                  {saving ? 'Salvando...' : 'Salvar categoria'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Dialog>
    </Card>
  )
}
