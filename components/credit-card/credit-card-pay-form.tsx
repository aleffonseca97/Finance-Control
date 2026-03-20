'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { payCreditCardFromBalance } from '@/app/actions/credit-cards'
import type { CreditCard } from '@prisma/client'

function SubmitPayButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? 'Registrando...' : 'Confirmar pagamento'}
    </Button>
  )
}

type CreditCardPayFormProps = {
  card: CreditCard
  availableCash: number
  maxPay: number
  onDone?: () => void
}

export function CreditCardPayForm({
  card,
  availableCash,
  maxPay,
  onDone,
}: CreditCardPayFormProps) {
  const router = useRouter()
  const [error, setError] = useState('')
  const today = new Date().toISOString().slice(0, 10)

  async function handleSubmit(formData: FormData) {
    setError('')
    formData.set('creditCardId', card.id)
    const result = await payCreditCardFromBalance(formData)
    if (result?.error) setError(result.error)
    else if (result?.success) {
      router.refresh()
      onDone?.()
    }
  }

  if (maxPay <= 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nada a pagar neste cartão (limite totalmente disponível).
      </p>
    )
  }

  return (
    <form action={handleSubmit} className="space-y-3 pt-2 border-t">
      {error ? (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
          {error}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        O pagamento usa apenas o <strong>saldo em caixa do mês</strong> (entradas menos
        despesas do orçamento e investimentos — já inclui a fatura após o fechamento) e
        <strong> só devolve limite</strong>, sem nova despesa no orçamento.
      </p>
      <p className="text-xs text-muted-foreground">
        Disponível em caixa:{' '}
        <span className="font-medium text-foreground">
          R${' '}
          {availableCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
        {' · '}
        Máx. a pagar neste cartão:{' '}
        <span className="font-medium text-foreground">
          R$ {maxPay.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`pay-amount-${card.id}`}>Valor (R$)</Label>
          <Input
            id={`pay-amount-${card.id}`}
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            max={maxPay}
            required
            placeholder="0,00"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`pay-date-${card.id}`}>Data</Label>
          <Input
            id={`pay-date-${card.id}`}
            name="date"
            type="date"
            defaultValue={today}
            required
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <SubmitPayButton />
        {onDone ? (
          <Button type="button" variant="outline" size="sm" onClick={onDone}>
            Cancelar
          </Button>
        ) : null}
      </div>
    </form>
  )
}
