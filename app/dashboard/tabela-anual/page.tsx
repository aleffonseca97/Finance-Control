import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { MonthFilter } from '@/components/forms/month-filter'
import { FinancialAnalysisTable } from '@/components/dashboard/financial-analysis-table'
import { getAnnualAnalysis, getDailyAnalysis, getMonthlyAnalysis } from '@/app/actions/analysis'

export default async function TabelaAnualPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const month = params.month ? parseInt(params.month, 10) : undefined
  const year = params.year ? parseInt(params.year, 10) : undefined

  const [dailyData, monthlyData, annualData] = await Promise.all([
    getDailyAnalysis(month, year),
    getMonthlyAnalysis(year),
    getAnnualAnalysis(5),
  ])

  return (
    <div className="space-y-6 p-6 pt-8 md:p-8 md:pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tabela Anual</h1>
          <p className="text-muted-foreground">
            Analise diaria, mensal e anual em uma unica janela com side-scroll
          </p>
        </div>
        <MonthFilter />
      </div>

      <FinancialAnalysisTable dailyData={dailyData} monthlyData={monthlyData} annualData={annualData} />
    </div>
  )
}
