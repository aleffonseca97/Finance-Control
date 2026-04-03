import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { User, Tags, PiggyBank } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'

export default async function ConfiguracoesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const links = [
    { href: '/dashboard/configuracoes/perfil', label: 'Perfil', description: 'Edite suas informações pessoais e senha', icon: User },
    { href: '/dashboard/configuracoes/categorias', label: 'Categorias', description: 'Gerencie categorias de entradas e saídas', icon: Tags },
    { href: '/dashboard/configuracoes/investimentos', label: 'Investimentos', description: 'Gerencie categorias de investimentos', icon: PiggyBank },
  ]

  return (
    <div className="space-y-8">
      <DashboardPageHeader
        title="Configurações"
        description="Gerencie seu perfil e categorias"
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {links.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Card className="dashboard-bento-card-muted h-full transition-all hover:border-primary/25 hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{item.label}</CardTitle>
                  </div>
                  <CardDescription>{item.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
