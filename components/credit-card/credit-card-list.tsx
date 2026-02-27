'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CreditCardForm } from './credit-card-form'
import { createCreditCard, updateCreditCard, deleteCreditCard } from '@/app/actions/credit-cards'
import type { CreditCard } from '@prisma/client'
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react'

interface CreditCardListProps {
  cards: CreditCard[]
}

export function CreditCardList({ cards }: CreditCardListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCard = editingId ? cards.find((c) => c.id === editingId) : null

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este cartão?')) return
    await deleteCreditCard(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Meus cartões</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo cartão
        </Button>
      </div>

      {(showForm || editingId) && (
        <CreditCardForm
          initialCard={editingCard ?? undefined}
          createAction={createCreditCard}
          updateAction={updateCreditCard}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-2">
        {cards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum cartão cadastrado. Clique em &quot;Novo cartão&quot; para começar.
          </p>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div
                  className="rounded-lg p-3"
                  style={{ backgroundColor: `${card.color}20` }}
                >
                  <CreditCardIcon
                    className="text-foreground"
                    size={24}
                    style={{ color: card.color ?? undefined }}
                  />
                </div>
                <div>
                  <p className="font-medium">
                    {card.name}
                    {card.lastFour ? (
                      <span className="ml-2 text-muted-foreground">
                        •••• {card.lastFour}
                      </span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Limite R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    {' • '}
                    Fechamento: dia {card.closingDay}
                    {' • '}
                    Vencimento: dia {card.dueDay}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(editingId === card.id ? null : card.id)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(card.id)}
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
