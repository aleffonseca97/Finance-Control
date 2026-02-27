'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CategoryIcon } from '@/components/category/category-icon'
import type { Category } from '@prisma/client'

interface CreditCard {
  id: string
  name: string
  lastFour: string | null
  limit: number
  color: string | null
}

interface TransactionFormProps {
  type: 'income' | 'expense'
  categories: Category[]
  creditCards?: CreditCard[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

function SubmitButton({ type }: { type: 'income' | 'expense' }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : type === 'income' ? 'Adicionar entrada' : 'Adicionar saída'}
    </Button>
  )
}

export function TransactionForm({ type, categories, creditCards = [], action }: TransactionFormProps) {
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  function handleCategoryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (type !== 'expense') return
    const categoryId = e.target.value
    const category = categories.find((c) => c.id === categoryId)
    const amountInput = document.getElementById('amount') as HTMLInputElement | null
    const defVal = category && 'defaultValue' in category ? (category as { defaultValue?: number | null }).defaultValue : null
    if (defVal != null && amountInput) {
      amountInput.value = String(defVal)
    }
  }

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      const form = document.getElementById('transaction-form') as HTMLFormElement | null
      if (form) {
        form.reset()
        const dateInput = form.querySelector<HTMLInputElement>('[name="date"]')
        if (dateInput) dateInput.value = today
      }
    }
  }

  return (
    <form
      id="transaction-form"
      action={handleSubmit}
      className="space-y-4 p-4 rounded-lg border bg-card"
    >
      <input type="hidden" name="type" value={type} />
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Select
            id="categoryId"
            name="categoryId"
            required
            onChange={handleCategoryChange}
          >
            <option value="">Selecione...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="date">Data</Label>
          <Input id="date" name="date" type="date" defaultValue={today} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input id="description" name="description" type="text" placeholder="Opcional" />
        </div>
        {type === 'expense' && creditCards.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="creditCardId">Método de pagamento</Label>
            <Select id="creditCardId" name="creditCardId">
              <option value="">À vista (dinheiro/PIX)</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                  {card.lastFour ? ` •••• ${card.lastFour}` : ''} (R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} disponível)
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>
      <SubmitButton type={type} />
    </form>
  )
}
