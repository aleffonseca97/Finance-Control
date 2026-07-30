'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCardForm } from './credit-card-form'
import {
  createCreditCard,
  updateCreditCard,
  deleteCreditCard,
  type CreditCardWithMonthUsage,
} from '@/app/actions/credit-cards'
import {
  Plus,
  Pencil,
  Trash2,
  CreditCard as CreditCardIcon,
} from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'

interface CreditCardListProps {
  cards: CreditCardWithMonthUsage[]
}

export function CreditCardList({ cards }: CreditCardListProps) {
  const t = useTranslations('dashboard.creditCard')
  const tForms = useTranslations('forms.buttons')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm(t('deleteConfirm'))) return
    await deleteCreditCard(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="font-semibold text-base sm:text-sm">{t('myCards')}</h3>
        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto min-h-11 sm:min-h-9 touch-manipulation"
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2 shrink-0" />
          {t('newCard')}
        </Button>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground rounded-md border bg-muted/20 px-3 py-2">
        {t('helpText')}
      </p>

      {(showForm || editingId) && (
        <CreditCardForm
          initialCard={editingCard ?? undefined}
          createAction={createCreditCard}
          updateAction={updateCreditCard}
          onCancel={handleCancel}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center sm:col-span-2 xl:col-span-3">
            {t('empty')}
          </p>
        ) : (
          cards.map((card) => {
            const total = card.totalLimit
            const monthSpent = card.monthSpent
            const pct = card.usagePct

            return (
              <div
                key={card.id}
                className="rounded-xl border bg-card p-4 shadow-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className="rounded-lg p-2.5 shrink-0"
                      style={{ backgroundColor: `${card.color}20` }}
                    >
                      <CreditCardIcon
                        className="text-foreground"
                        size={22}
                        style={{ color: card.color ?? undefined }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {card.name}
                        {card.lastFour ? (
                          <span className="ml-1.5 text-muted-foreground text-sm font-normal">
                            •••• {card.lastFour}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('closing')} {card.closingDay} · {t('due')} {card.dueDay}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        setShowForm(false)
                        setEditingId(editingId === card.id ? null : card.id)
                      }}
                      aria-label={tForms('edit')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(card.id)}
                      aria-label={tForms('delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{t('monthSpend')}</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(monthSpent, locale, currency)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">{t('total')}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatCurrency(total, locale, currency)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: card.color ?? '#6366f1',
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {t('usageOfLimit', { pct: Math.round(pct) })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
