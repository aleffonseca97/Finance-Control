import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TabelaAnualFilters } from '@/components/forms/tabela-anual-filters'
import { FinancialAnalysisTable } from '@/components/dashboard/financial-analysis-table'
import { getAnnualAnalysis, getDailyAnalysis, getMonthlyAnalysis } from '@/app/actions/analysis'
import type { TableView } from '@/components/forms/table-view-dropdown'

export default async function TabelaAnualPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined
  const rawView = params.view
  const view: TableView =
    rawView === 'daily' || rawView === 'monthly' || rawView === 'annual'
      ? rawView
      : 'daily'

  const dailyData =
    view === 'daily' ? await getDailyAnalysis(month, year) : []
  const monthlyData =
    view === 'monthly' ? await getMonthlyAnalysis(year) : []
  const annualData =
    view === 'annual' ? await getAnnualAnalysis(5) : []

  return (
    <div className="space-y-6 p-6 pt-8 md:p-8 md:pt-10">
      {/* Mensagem para dispositivos pequenos */}
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-8 md:hidden">
        <div className="mx-auto max-w-sm space-y-2 text-center">
          <h2 className="text-lg font-semibold">Disponível apenas em dispositivos maiores</h2>
          <p className="text-sm text-muted-foreground">
            A Tabela Anual está disponível apenas para visualização em PC ou Tablet. Acesse de um dispositivo com tela maior para usar esta funcionalidade.
          </p>
        </div>
      </div>

      {/* Conteúdo para PC e Tablet */}
      <div className="hidden md:block">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Tabela Anual</h1>
            <p className="text-muted-foreground">
              Analise diaria, mensal e anual em uma unica janela
            </p>
          </div>
          <TabelaAnualFilters />
        </div>

        <FinancialAnalysisTable
          view={view}
          dailyData={dailyData}
          monthlyData={monthlyData}
          annualData={annualData}
        />
      </div>
    </div>
  )
}
