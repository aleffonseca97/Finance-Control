import { Suspense } from 'react'
import { AssinaturaClient } from './assinatura-client'

export default async function AssinaturaPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <AssinaturaClient />
    </Suspense>
  )
}
