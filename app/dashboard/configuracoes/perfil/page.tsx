import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ProfileForm } from '@/components/settings/profile-form'
import { ThemeToggle } from '@/components/theme-toggle'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, marketingOptIn: true },
  })

  if (!user) redirect('/login')

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Perfil"
        description="Edite suas informações pessoais e altere sua senha"
      />

      <div className="dashboard-bento-card-muted flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Aparência</h2>
          <p className="text-sm text-muted-foreground">
            Alterne entre tema claro e escuro
          </p>
        </div>
        <div className="flex justify-end sm:shrink-0">
          <ThemeToggle />
        </div>
      </div>

      <ProfileForm
        name={user.name}
        email={user.email}
        marketingOptIn={user.marketingOptIn}
      />
    </div>
  )
}
