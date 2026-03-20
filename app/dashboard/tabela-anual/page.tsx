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
  )
}
