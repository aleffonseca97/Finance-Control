'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { CATEGORY_ICON_OPTIONS } from '@/components/category/category-icon'
import { localizeStoredLabel } from '@/lib/i18n/localize-label'
import type { AppLocale } from '@/i18n/routing'
import type { Category } from '@prisma/client'

interface CategoryFormProps {
  type: 'income' | 'expense' | 'investment'
  isFixed?: boolean
  availableGroups?: string[]
  initialCategory?: Category | null
  createAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  updateAction: (id: string, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onCancel?: () => void
  investmentSubtype?: 'reserva' | 'carteira'
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const t = useTranslations('forms.buttons')
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t('saving') : isEdit ? t('save') : t('add')}
    </Button>
  )
}

export function CategoryForm({
  type,
  isFixed = false,
  availableGroups = [],
  initialCategory,
  createAction,
  updateAction,
  onCancel,
  investmentSubtype,
}: CategoryFormProps) {
  const t = useTranslations('settings.categories')
  const tForms = useTranslations('forms')
  const tIcons = useTranslations('common.icons')
  const locale = useLocale() as AppLocale
  const [error, setError] = useState('')
  const isEdit = !!initialCategory
  const fallbackGroup = type === 'investment' ? t('investmentsGroup') : t('customGroup')
  const selectedGroup = initialCategory?.group?.trim() || fallbackGroup
  const groupOptions = Array.from(
    new Set(
      [...availableGroups, selectedGroup, fallbackGroup]
        .map((group) => group.trim())
        .filter((group) => group.length > 0)
    )
  ).sort((a, b) =>
    localizeStoredLabel(a, locale).localeCompare(localizeStoredLabel(b, locale), locale)
  )

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
          <Label htmlFor="name">{tForms('labels.name')}</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialCategory?.name}
            placeholder={tForms('placeholders.categoryName')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="group">{tForms('labels.mainCategory')}</Label>
          <Select
            id="group"
            name="group"
            defaultValue={selectedGroup}
            required
          >
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {localizeStoredLabel(group, locale)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="icon">{tForms('labels.icon')}</Label>
          <Select
            id="icon"
            name="icon"
            defaultValue={initialCategory?.icon ?? 'CircleDollarSign'}
            required
          >
            {CATEGORY_ICON_OPTIONS.map((key) => (
              <option key={key} value={key}>
                {tIcons(key)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">{tForms('labels.color')}</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={initialCategory?.color ?? '#6366f1'}
            className="h-10 w-20 p-1 cursor-pointer"
          />
        </div>
        {type === 'investment' && (
          <div className="space-y-2">
            <Label htmlFor="investmentSubtype">{tForms('labels.type')}</Label>
            <Select
              id="investmentSubtype"
              name="investmentSubtype"
              defaultValue={
                initialCategory && 'investmentSubtype' in initialCategory
                  ? initialCategory.investmentSubtype ?? investmentSubtype ?? ''
                  : investmentSubtype ?? ''
              }
              required
            >
              <option value="">{tForms('placeholders.select')}</option>
              <option value="reserva">{tForms('investmentSubtype.reserve')}</option>
              <option value="carteira">{tForms('investmentSubtype.wallet')}</option>
            </Select>
          </div>
        )}
        {type === 'expense' && isFixed && (
          <div className="space-y-2">
            <Label htmlFor="defaultValue">{tForms('labels.defaultValue')}</Label>
            <Input
              id="defaultValue"
              name="defaultValue"
              type="number"
              step="0.01"
              min="0"
              placeholder={tForms('placeholders.amount')}
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
              {tForms('buttons.cancel')}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
