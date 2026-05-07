import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { getReserveCategories } from '@/app/actions/categories'
import { createGoal, createReserveFromGoal, deleteGoal, getGoals, updateGoalCurrentAmount } from '@/app/actions/goals'
import { MetasContent } from './metas-content'

export default async function MetasPage() {
  const [goals, reserveCategories] = await Promise.all([getGoals(), getReserveCategories()])

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8">
      <DashboardPageHeader
        title="Metas"
        description="Cadastre objetivos financeiros, com ou sem prazo, e acompanhe sua evolução."
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
