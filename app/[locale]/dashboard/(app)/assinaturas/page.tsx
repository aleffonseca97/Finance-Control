import { localeRedirect } from '@/lib/i18n/server-redirect'
import { auth } from '@/lib/auth'
import { getSubscriptionsPageData } from '@/app/actions/analysis'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { AssinaturasContent } from './assinaturas-content'
import { getTranslations } from 'next-intl/server'

export default async function AssinaturasPage() {
  const t = await getTranslations('dashboard.subscriptionsAnalysis')
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const data = await getSubscriptionsPageData()
  if (!data) await localeRedirect('/login')

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t('title')} description={t('description')} />
      <AssinaturasContent data={data} />
    </div>
  )
}
