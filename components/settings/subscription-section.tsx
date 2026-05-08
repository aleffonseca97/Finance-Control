'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'

type SubscriptionData = {
  status: string
  currentPeriodEnd: Date
  trialEnd: Date | null
  cancelAtPeriodEnd: boolean
} | null

interface SubscriptionSectionProps {
  stripeCustomerId: string | null
  subscription: SubscriptionData
}

const STATUS_LABELS: Record<string, string> = {
  trialing: 'Em avaliação',
  active: 'Ativa',
  past_due: 'Pagamento pendente',
  canceled: 'Cancelada',
  unpaid: 'Não paga',
  incomplete: 'Incompleta',
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
  }).format(new Date(date))
}

function getStatusLabel(status?: string) {
  if (!status) return 'Sem assinatura'
  return STATUS_LABELS[status] ?? status
}

export function SubscriptionSection({
  stripeCustomerId,
  subscription,
}: SubscriptionSectionProps) {
  const [loadingAction, setLoadingAction] = useState<'checkout' | 'portal' | null>(null)
  const [error, setError] = useState('')

  const isActiveOrTrialing = useMemo(() => {
    return subscription ? ['trialing', 'active'].includes(subscription.status) : false
  }, [subscription])

  const nextBillingDate = subscription?.currentPeriodEnd
    ? formatDate(subscription.currentPeriodEnd)
    : null
  const trialEndDate = subscription?.trialEnd ? formatDate(subscription.trialEnd) : null

  async function openBillingFlow(action: 'checkout' | 'portal') {
    try {
      setError('')
      setLoadingAction(action)
      const endpoint = action === 'checkout' ? '/api/billing/checkout' : '/api/billing/portal'
      const res = await fetch(endpoint, { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data?.url) {
        throw new Error(data?.error ?? 'Não foi possível continuar no momento.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao processar assinatura.')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <section className="dashboard-bento-card-muted space-y-5 p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="font-semibold">Assinatura</h2>
        <p className="text-sm text-muted-foreground">
          Gerencie seu plano, cobrança e acesso aos recursos premium.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Status</p>
          <p className="mt-1 text-sm font-medium">{getStatusLabel(subscription?.status)}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Plano</p>
          <p className="mt-1 text-sm font-medium">Pro Mensal</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">
            {subscription?.status === 'trialing' ? 'Fim da avaliação' : 'Próxima renovação'}
          </p>
          <p className="mt-1 text-sm font-medium">{trialEndDate ?? nextBillingDate ?? '-'}</p>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <p className="text-xs text-muted-foreground">Valor</p>
          <p className="mt-1 text-sm font-medium">R$10,00 / mês</p>
        </div>
      </div>

      {subscription?.cancelAtPeriodEnd && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
          Sua assinatura está configurada para cancelar ao fim do período atual.
        </div>
      )}

      {!subscription && (
        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          Nenhuma assinatura encontrada. Ative seu plano para continuar com acesso completo.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
      )}

      <div className="flex flex-wrap gap-2">
        {isActiveOrTrialing && stripeCustomerId ? (
          <Button
            type="button"
            onClick={() => openBillingFlow('portal')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'portal' ? 'Abrindo...' : 'Gerenciar assinatura'}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => openBillingFlow('checkout')}
            disabled={loadingAction !== null}
          >
            {loadingAction === 'checkout' ? 'Redirecionando...' : 'Ativar assinatura'}
          </Button>
        )}

        {stripeCustomerId && (
          <Button
            type="button"
            variant="outline"
            onClick={() => openBillingFlow('portal')}
            disabled={loadingAction !== null}
          >
            Portal de cobrança
          </Button>
        )}
      </div>
    </section>
  )
}
