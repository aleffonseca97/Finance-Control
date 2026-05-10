import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ParcelamentosPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8">
      <DashboardPageHeader
        title="Parcelamentos"
        description="Planejamento de financiamentos, empréstimos e parcelas no orçamento anual."
      />
      <Card className="dashboard-bento-card-muted sticky top-24 z-20 border-dashed shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Em construção</CardTitle>
          <CardDescription>
            Esta área está temporariamente desativada enquanto ajustamos a lógica de parcelamentos e o
            impacto no orçamento. Volte em breve.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Por enquanto, use <strong className="font-medium text-foreground">Saídas</strong>,{' '}
            <strong className="font-medium text-foreground">Recorrência</strong> e{' '}
            <strong className="font-medium text-foreground">Cartão de crédito</strong> para registrar seus
            gastos e compromissos mensais.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
