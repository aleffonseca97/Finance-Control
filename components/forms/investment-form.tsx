'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type { Category } from '@prisma/client'

interface InvestmentFormProps {
  categories: Category[]
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Adicionar aporte'}
    </Button>
  )
}

export function InvestmentForm({ categories, action }: InvestmentFormProps) {
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = await action(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success) {
      const form = document.getElementById('investment-form') as HTMLFormElement | null
      if (form) {
        form.reset()
        const dateInput = form.querySelector<HTMLInputElement>('[name="date"]')
        if (dateInput) dateInput.value = today
      }
    }
  }

  return (
    <form
      id="investment-form"
      action={handleSubmit}
      className="space-y-4 p-4 rounded-lg border bg-card"
    >
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="categoryId">Categoria</Label>
          <Select id="categoryId" name="categoryId" required>
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
          <Label htmlFor="notes">Observações</Label>
          <Input id="notes" name="notes" type="text" placeholder="Opcional" />
        </div>
      </div>
      <SubmitButton />
    </form>
  )
}
