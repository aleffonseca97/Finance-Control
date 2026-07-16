'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { CategoryIcon } from '@/components/category/category-icon'
import { CategoryForm } from './category-form'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import { formatCurrency } from '@/lib/i18n/format'
import { useCurrency } from '@/components/currency-provider'
import type { AppLocale } from '@/i18n/routing'
import type { Category } from '@prisma/client'
import { Plus, Pencil, Trash2 } from 'lucide-react'

interface CategoryListProps {
  categories: Category[]
  availableGroups?: string[]
  type: 'income' | 'expense' | 'investment'
  isFixed: boolean
  title: string
  investmentSubtype?: 'reserva' | 'carteira'
}

export function CategoryList({ categories, availableGroups = [], type, isFixed, title, investmentSubtype }: CategoryListProps) {
  const t = useTranslations('settings.categories')
  const locale = useLocale() as AppLocale
  const currency = useCurrency()
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
    if (!confirm(t('deleteConfirm'))) return
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
          {t('newCategory')}
        </Button>
      </div>

      {(showForm || editingId) && (
        <CategoryForm
          type={type}
          isFixed={isFixed}
          availableGroups={availableGroups}
          initialCategory={editingCategory ?? undefined}
          createAction={createCategory}
          updateAction={updateCategory}
          onCancel={handleCancel}
          investmentSubtype={investmentSubtype}
        />
      )}

      <div className="space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t('noCategories')}</p>
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
                  <span className="font-medium">{localizeStoredLabel(cat.name, locale)}</span>
                  {isFixed && 'defaultValue' in cat && cat.defaultValue != null && (
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formatCurrency(cat.defaultValue, locale, currency)}
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
                  aria-label={t('edit')}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(cat.id)}
                  aria-label={t('delete')}
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
