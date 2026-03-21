'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

type Props = {
  confirmMessage: string
  onDelete: () => Promise<unknown>
  ariaLabel?: string
}

export function DeleteConfirmButton({
  confirmMessage,
  onDelete,
  ariaLabel = 'Excluir',
}: Props) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm(confirmMessage)) return
    setPending(true)
    await onDelete()
    setPending(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive cursor-pointer"
      onClick={handleDelete}
      disabled={pending}
      aria-label={ariaLabel}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
