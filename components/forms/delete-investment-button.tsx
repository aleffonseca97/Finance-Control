'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { deleteInvestment } from '@/app/actions/investments'

export function DeleteInvestmentButton({ id }: { id: string }) {
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    if (!confirm('Excluir este aporte?')) return
    setPending(true)
    await deleteInvestment(id)
    setPending(false)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-destructive cursor-pointer"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Excluir"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  )
}
