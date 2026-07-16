'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CreditCard } from '@prisma/client'
import { useTranslations } from 'next-intl'

interface CreditCardFormProps {
  initialCard?: CreditCard | null
  createAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>
  updateAction: (id: string, formData: FormData) => Promise<{ error?: string; success?: boolean }>
  onCancel?: () => void
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  const tForms = useTranslations('forms.buttons')
  return (
    <Button
      type="submit"
      disabled={pending}
      className="min-h-10 touch-manipulation sm:min-h-9"
    >
      {pending ? tForms('saving') : isEdit ? tForms('save') : tForms('add')}
    </Button>
  )
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function CreditCardForm({
  initialCard,
  createAction,
  updateAction,
  onCancel,
}: CreditCardFormProps) {
  const t = useTranslations('dashboard.creditCard')
  const tForms = useTranslations('forms')
  const [error, setError] = useState('')
  const isEdit = !!initialCard

  async function handleSubmit(formData: FormData) {
    setError('')
    const result = isEdit
      ? await updateAction(initialCard!.id, formData)
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="name">{tForms('labels.name')}</Label>
          <Input
            id="name"
            name="name"
            defaultValue={initialCard?.name}
            placeholder={t('cardNamePlaceholder')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastFour">{tForms('labels.lastFour')}</Label>
          <Input
            id="lastFour"
            name="lastFour"
            maxLength={4}
            defaultValue={initialCard?.lastFour ?? ''}
            placeholder={tForms('placeholders.lastFour')}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="totalLimit">{tForms('labels.limit')}</Label>
          <Input
            id="totalLimit"
            name="totalLimit"
            type="number"
            step="0.01"
            min="0"
            defaultValue={initialCard?.totalLimit ?? initialCard?.limit}
            placeholder={tForms('placeholders.amount')}
            required
          />
          <p className="text-xs text-muted-foreground">
            {t('limitHelp')}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="closingDay">{tForms('labels.closingDay')}</Label>
          <select
            id="closingDay"
            name="closingDay"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={initialCard?.closingDay ?? 10}
            required
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueDay">{tForms('labels.dueDay')}</Label>
          <select
            id="dueDay"
            name="dueDay"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            defaultValue={initialCard?.dueDay ?? 15}
            required
          >
            {DAYS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">{tForms('labels.color')}</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue={initialCard?.color ?? '#6366f1'}
            className="h-10 w-20 p-1 cursor-pointer"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-2">
          <SubmitButton isEdit={isEdit} />
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="min-h-10 touch-manipulation sm:min-h-9"
            >
              {tForms('buttons.cancel')}
            </Button>
          )}
        </div>
      </div>
    </form>
  )
}
