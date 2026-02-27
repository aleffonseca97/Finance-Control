'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CategoryIcon } from '@/components/category/category-icon'
import { CATEGORY_ICONS } from '@/components/category/category-icon'
import type { Category } from '@prisma/client'

interface CategoryFormProps {
  type: 'income' | 'expense'
  isFixed?: boolean
  initialCategory?: Category | null
  createAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  updateAction: (id: string, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onCancel?: () => void
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : isEdit ? 'Salvar' : 'Adicionar'}
    </Button>
  )
}

export function CategoryForm({
  type,
  isFixed = false,
  initialCategory,
  createAction,
  updateAction,
  onCancel,
}: CategoryFormProps) {
  const [error, setError] = useState('')
  const isEdit = !!initialCategory

  async function handleSubmit(formData: FormData) {
    setError('')
    formData.set('type', type)
    formData.set('isFixed', String(isFixed))
    const result = isEdit
      ? await updateAction(initialCategory!.id, formData)
      : await createAction(formData)
    if (result?.error) {
      setError(result.error)
    } else if (result?.success && onCancel) {
      onCancel()
    }
  }

  return (
    <form
      action={handleSubmit}
      className="space-y-4 p-4 rounded-lg border bg-muted/30"
    >
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      {isEdit && (
        <input type="hidden" name="categoryId" value={initialCategory.id} />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialCategory?.name}
            placeholder="Ex: Mercado"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon">Ícone</Label>
          <Select
            id="icon"
            name="icon"
            defaultValue={initialCategory?.icon ?? 'CircleDollarSign'}
            required
          >
            {CATEGORY_ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Cor</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={initialCategory?.color ?? '#6366f1'}
            className="h-10 w-20 p-1 cursor-pointer"
          />
        </div>
        {type === 'expense' && isFixed && (
          <div className="space-y-2">
            <Label htmlFor="defaultValue">Valor prefixado (R$)</Label>
            <Input
              id="defaultValue"
              name="defaultValue"
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              defaultValue={
                initialCategory && 'defaultValue' in initialCategory && initialCategory.defaultValue != null
                  ? String(initialCategory.defaultValue)
                  : ''
              }
            />
          </div>
        )}
        <div className="flex items-end gap-2">
          <SubmitButton isEdit={isEdit} />
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
