import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getInstallmentPlansPageData } from '@/app/actions/installment-plans'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { ParcelamentosContent } from './parcelamentos-content'
import { getTranslations } from 'next-intl/server'

export default async function ParcelamentosPage() {
  const t = await getTranslations('dashboard.installmentsAnalysis')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const year = new Date().getFullYear()
  const data = await getInstallmentPlansPageData(year)
  if (!data) await localeRedirect('/login')

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t('title')} description={t('description')} />
      <ParcelamentosContent data={data} />
    </div>
  )
}
