'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/category/category-icon'
import { CategoryForm } from './category-form'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import type { Category } from '@prisma/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CategoryListProps {
  categories: Category[]
  type: 'income' | 'expense'
  isFixed: boolean
  title: string
}

export function CategoryList({ categories, type, isFixed, title }: CategoryListProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const editingCategory = editingId
    ? categories.find((c) => c.id === editingId)
    : null

  function handleCancel() {
    setShowForm(false)
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria? Transações e investimentos vinculados também serão removidos.')) return
    await deleteCategory(id)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingId(null)
            setShowForm(!showForm)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova categoria
        </Button>
      </div>

      {(showForm || editingId) && (
        <CategoryForm
          type={type}
          isFixed={isFixed}
          initialCategory={editingCategory ?? undefined}
          createAction={createCategory}
          updateAction={updateCategory}
          onCancel={handleCancel}
        />
      )}

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma categoria cadastrada</p>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-full p-2"
                  style={{ backgroundColor: `${cat.color}20` }}
                >
                  <CategoryIcon icon={cat.icon} className="text-foreground" size={18} />
                </div>
                <div>
                  <span className="font-medium">{cat.name}</span>
                  {isFixed && 'defaultValue' in cat && cat.defaultValue != null && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      R$ {cat.defaultValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => {
                    setShowForm(false)
                    setEditingId(editingId === cat.id ? null : cat.id)
                  }}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id)}
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
