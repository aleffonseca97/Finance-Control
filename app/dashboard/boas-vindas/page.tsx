import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import {
  Tags,
  PiggyBank,
  TrendingUp,
  CreditCard,
  ExternalLink,
  Sparkles,
  MessageCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DashboardPageHeader } from '@/components/dashboard/dashboard-page-header'
import { ContinuarButton } from './continuar-button'

export default async function BoasVindasPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSeenWelcome: true },
  })

  if (user?.hasSeenWelcome) redirect('/dashboard')

  const userName = session.user.name?.split(' ')?.[0] || session.user.name || 'Usuário'

  const sections = [
    {
      title: 'Categorias',
      icon: Tags,
      description:
        'As categorias organizam suas entradas, saídas e despesas. Você pode ter despesas fixas (aluguel, contas) e variáveis (mercado, lazer). Crie e edite conforme sua necessidade em Configurações.',
      href: '/dashboard/configuracoes/categorias',
      linkLabel: 'Configurações > Categorias',
    },
    {
      title: 'Reservas e Carteiras',
      icon: PiggyBank,
      description:
        'Reservas são seus objetivos de economia (Reserva Emergência, Reserva Viagem, etc.). Carteiras são onde o dinheiro está aplicado (CDB, Poupança, Tesouro Direto, Ações). Configure em Configurações > Investimentos.',
      href: '/dashboard/configuracoes/investimentos',
      linkLabel: 'Configurações > Investimentos',
    },
    {
      title: 'Aportes',
      icon: TrendingUp,
      description:
        'Registre suas contribuições em Investimentos. Cada aporte vincula uma reserva (objetivo) a uma carteira (aplicação). Acompanhe o total investido por categoria.',
      href: '/dashboard/investimentos',
      linkLabel: 'Investimentos',
    },
    {
      title: 'Cartão de Crédito',
      icon: CreditCard,
      description: (
        <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
          <li>
            <strong>Cadastro:</strong> Nome, limite total, dia de fechamento e vencimento. Opcional: últimos 4 dígitos.
          </li>
          <li>
            <strong>Compras:</strong> Reduzem o limite na hora e não entram no orçamento de caixa.
          </li>
          <li>
            <strong>Fatura:</strong> Ao pagar na aba do cartão, a saída entra no orçamento de caixa e o limite é restaurado.
          </li>
          <li>
            <strong>Pagamento:</strong> Usa o saldo em caixa e restaura o limite do cartão.
          </li>
          <li>
            <strong>Alerta:</strong> Fatura em atraso é exibida quando o vencimento passa com saldo em aberto.
          </li>
        </ul>
      ),
      href: '/dashboard/cartao-credito',
      linkLabel: 'Cartão de Crédito',
    },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <DashboardPageHeader
        leading={<Sparkles className="h-8 w-8 shrink-0 text-primary" aria-hidden />}
        title={`Bem-vindo, ${userName}!`}
        description="Veja algumas orientações para começar a usar o Controle Financeiro."
      />

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="dashboard-bento-card-muted transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {typeof section.description === 'string' ? (
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                ) : (
                  section.description
                )}
                <Link
                  href={section.href}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {section.linkLabel}
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="dashboard-bento-card-muted border-dashed">
        <CardContent className="flex items-center gap-3 py-4">
          <MessageCircle className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Estamos sempre buscando melhorar.</p>
            <p className="text-sm text-muted-foreground">
              Se quiser reportar algo, procure um de nossos desenvolvedores: ALEF, HENRIQUE.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <ContinuarButton />
      </div>
    </div>
  )
}
