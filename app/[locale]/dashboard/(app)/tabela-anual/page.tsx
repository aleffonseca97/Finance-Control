import { auth } from '@/lib/auth'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { TabelaAnualFilters } from '@/components/forms/tabela-anual-filters'
import { FinancialAnalysisTable } from '@/components/dashboard/financial-analysis-table'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { getAnnualAnalysis, getDailyAnalysis, getMonthlyAnalysis } from '@/app/actions/analysis'
import type { TableView } from '@/components/forms/table-view-dropdown'
import { getTranslations } from 'next-intl/server'

export default async function TabelaAnualPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; view?: string }>
}) {
  const tAnnual = await getTranslations('dashboard.annualTable')
  const tShared = await getTranslations('dashboard.shared')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

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
    <div className="space-y-8">
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 rounded-[var(--dashboard-bento-radius)] border border-dashed border-muted-foreground/30 bg-muted/30 p-8 shadow-sm md:hidden">
        <div className="mx-auto max-w-sm space-y-2 text-center">
          <h2 className="text-lg font-semibold">{tShared('annualTableMobileTitle')}</h2>
          <p className="text-sm text-muted-foreground">
            {tShared('annualTableMobileDescription')}
          </p>
        </div>
      </div>

      <div className="hidden md:block space-y-6">
        <DashboardPageHeader
          title={tAnnual('title')}
          description={tAnnual('description')}
          actions={<TabelaAnualFilters />}
        />

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
