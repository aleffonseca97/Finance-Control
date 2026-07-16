import { auth } from '@/lib/auth'
import { getLocale, getTranslations } from 'next-intl/server'
import { localeRedirect } from '@/lib/i18n/server-redirect'
import { compareLocale } from '@/lib/i18n/format'
import type { AppLocale } from '@/i18n/routing'
import { getCategoriesByType, getUserCategoriesByType } from '@/app/actions/categories'
import { CategoryList } from '@/components/settings/category-list'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function CategoriasPage() {
  const session = await auth()
  if (!session?.user?.id) await localeRedirect('/login')

  const t = await getTranslations('settings.categories')
  const locale = (await getLocale()) as AppLocale

  const [expenseCategories, incomeCategories, allExpenseCategories, allIncomeCategories] = await Promise.all([
    getUserCategoriesByType('expense'),
    getUserCategoriesByType('income'),
    getCategoriesByType('expense'),
    getCategoriesByType('income'),
  ])

  const variableExpenses = expenseCategories.filter((c) => !c.isFixed)
  const fixedExpenses = expenseCategories.filter((c) => c.isFixed)
  const expenseGroups = Array.from(
    new Set(
      allExpenseCategories
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => compareLocale(a, b, locale))
  const incomeGroups = Array.from(
    new Set(
      allIncomeCategories
        .map((category) => category.group?.trim())
        .filter((group): group is string => !!group)
    )
  ).sort((a, b) => compareLocale(a, b, locale))

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-1">
          <Card className="dashboard-bento-card shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{t('variableExpenses')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('variableExpensesHint')}
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={variableExpenses}
                availableGroups={expenseGroups}
                type="expense"
                isFixed={false}
                title=""
              />
            </CardContent>
          </Card>

          <Card className="dashboard-bento-card-muted shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{t('fixedExpenses')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('fixedExpensesHint')}
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={fixedExpenses}
                availableGroups={expenseGroups}
                type="expense"
                isFixed={true}
                title=""
              />
            </CardContent>
          </Card>

          <Card className="dashboard-bento-card shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{t('incomeOptions')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('incomeOptionsHint')}
              </p>
            </CardHeader>
            <CardContent>
              <CategoryList
                categories={incomeCategories}
                availableGroups={incomeGroups}
                type="income"
                isFixed={false}
                title=""
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
