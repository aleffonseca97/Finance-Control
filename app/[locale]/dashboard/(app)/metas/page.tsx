import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { getReserveCategories } from '@/app/actions/categories'
import { createGoal, createReserveFromGoal, deleteGoal, getGoals, updateGoalCurrentAmount } from '@/app/actions/goals'
import { MetasContent } from './metas-content'
import { getTranslations } from 'next-intl/server'

export default async function MetasPage() {
  const t = await getTranslations('dashboard.goals')
  const [goals, reserveCategories] = await Promise.all([getGoals(), getReserveCategories()])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />
      <MetasContent
        goals={goals}
        reserveCategories={reserveCategories}
        createGoalAction={createGoal}
        createReserveAction={createReserveFromGoal}
        updateGoalCurrentAmountAction={updateGoalCurrentAmount}
        deleteGoalAction={deleteGoal}
      />
    </div>
  )
}
