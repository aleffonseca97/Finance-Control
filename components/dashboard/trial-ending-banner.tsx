'use client'

import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const DISMISS_STORAGE_KEY = 'finance-trial-ending-banner-dismissed'

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'menos de um minuto'
  const totalSec = Math.floor(ms / 1000)
  const days = Math.floor(totalSec / 86400)
  const hours = Math.floor((totalSec % 86400) / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  if (days > 0) {
    const d = days === 1 ? '1 dia' : `${days} dias`
    if (hours > 0) {
      const h = hours === 1 ? '1 hora' : `${hours} horas`
      return `${d} e ${h}`
    }
    return d
  }
  if (hours > 0) {
    const h = hours === 1 ? '1 hora' : `${hours} horas`
    if (minutes > 0) return `${h} e ${minutes} min`
    return h
  }
  return minutes <= 1 ? '1 minuto' : `${minutes} minutos`
}

type TrialEndingBannerProps = {
  trialEndIso: string
}

export function TrialEndingBanner({ trialEndIso }: TrialEndingBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const [tick, setTick] = useState(0)

  useLayoutEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_STORAGE_KEY) === trialEndIso) {
        setDismissed(true)
      }
    } catch {
      /* ignore */
    }
  }, [trialEndIso])

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(id)
  }, [trialEndIso])

  const msLeft = useMemo(() => {
    void tick
    return new Date(trialEndIso).getTime() - Date.now()
  }, [trialEndIso, tick])

  if (dismissed || msLeft <= 0) return null

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, trialEndIso)
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div
      role="status"
      className="relative flex flex-col gap-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 pr-12 text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/15 dark:text-amber-50 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5 sm:pr-14"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold leading-snug">Fim da avaliação gratuita</p>
        <p className="text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
          Restam{' '}
          <span className="font-medium tabular-nums text-amber-950 dark:text-amber-50">
            {formatRemaining(msLeft)}
          </span>
          . Em seguida, a cobrança mensal será feita no cartão cadastrado.
        </p>
      </div>
      <Button variant="secondary" size="sm" className="shrink-0 self-start sm:self-center" asChild>
        <Link href="/dashboard/configuracoes/perfil">Ver assinatura</Link>
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1 size-9 text-amber-900/80 hover:bg-amber-500/25 hover:text-amber-950 dark:text-amber-100/80 dark:hover:bg-amber-500/20 dark:hover:text-amber-50"
        onClick={dismiss}
        aria-label="Fechar aviso do fim da avaliação"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
