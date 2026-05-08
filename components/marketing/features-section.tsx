import {
  TrendingUp,
  CreditCard,
  Target,
  BarChart2,
  RefreshCw,
  Wallet,
} from 'lucide-react'

const features = [
  {
    icon: TrendingUp,
    title: 'Entradas e saídas centralizadas',
    description:
      'Lance receitas e despesas com categoria, data e descrição. Visualize o fluxo de caixa mês a mês sem planilhas.',
    tag: 'Fluxo de caixa',
  },
  {
    icon: CreditCard,
    title: 'Controle de cartão de crédito',
    description:
      'Acompanhe o limite disponível, faturas fechadas e gastos por categoria. Nunca mais seja surpreendido pela fatura.',
    tag: 'Limite em tempo real',
  },
  {
    icon: Target,
    title: 'Metas financeiras',
    description:
      'Defina objetivos com valor-alvo e prazo. Acompanhe o progresso visual diretamente no painel.',
    tag: 'Progresso visual',
  },
  {
    icon: BarChart2,
    title: 'Análise e relatórios',
    description:
      'Gráficos de evolução mensal, gastos por categoria e comparativos anuais. Veja para onde vai cada real.',
    tag: 'Insights automáticos',
  },
  {
    icon: RefreshCw,
    title: 'Pagamentos recorrentes',
    description:
      'Cadastre assinaturas e contas fixas. O sistema controla automaticamente mês a mês sem retrabalho.',
    tag: 'Sem trabalho repetitivo',
  },
  {
    icon: Wallet,
    title: 'Investimentos consolidados',
    description:
      'Registre aportes em reserva de emergência e carteira. Acompanhe o crescimento do seu patrimônio.',
    tag: 'Patrimônio consolidado',
  },
]

export default function FeaturesSection() {
  return (
    <section id="funcionalidades" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — left-aligned, not centered */}
        <div className="max-w-xl mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Funcionalidades
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight mb-4">
            Tudo que você precisa para organizar as finanças.
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Construído para quem quer visibilidade real do próprio dinheiro, sem
            complexidade desnecessária.
          </p>
        </div>

        {/* Features grid — 2 columns, NO equal 3-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-t border-zinc-200 dark:border-zinc-800">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group py-8 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors duration-200"
                style={{
                  paddingLeft: index % 2 === 1 ? '2.5rem' : '0',
                  paddingRight: index % 2 === 0 ? '2.5rem' : '0',
                }}
              >
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/15 dark:group-hover:bg-primary/25 transition-colors">
                    <Icon className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 [font-family:var(--font-outfit)]">
                        {feature.title}
                      </h3>
                      <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {feature.tag}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
