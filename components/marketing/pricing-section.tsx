import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'

const includedFeatures = [
  'Dashboard financeiro completo',
  'Controle de entradas e saídas',
  'Gestão de cartão de crédito',
  'Metas financeiras com progresso',
  'Registro de investimentos',
  'Relatórios e análises mensais',
  'Tabela anual de despesas',
  'Categorias personalizadas',
  'Pagamentos recorrentes automáticos',
]

export default function PricingSection() {
  return (
    <section id="precos" className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Preço
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
            Simples e sem surpresas.
          </h2>
        </div>

        {/* Single plan */}
        <div className="max-w-sm mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-white dark:bg-zinc-900 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.35)] p-8 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 dark:bg-primary/10 rounded-bl-full -translate-y-10 translate-x-10 pointer-events-none" />

            <div className="relative">
              {/* Trial badge */}
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-full px-3 py-1 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  3 meses grátis inclusos
                </span>
              </div>

              {/* Price display */}
              <div className="mb-2">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)]">
                    R$10
                  </span>
                  <span className="text-zinc-500 dark:text-zinc-400 pb-1.5 text-sm">/mês</span>
                </div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
                Após os 3 primeiros meses. Nenhuma cobrança durante o período de teste.
              </p>

              {/* CTA */}
              <Button className="w-full mb-4 text-base group" size="lg" asChild>
                <Link href="/registro">
                  Começar 3 meses grátis
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </Button>

              {/* Trust line */}
              <p className="text-center text-xs text-zinc-400 dark:text-zinc-500 mb-7">
                Cancele quando quiser · Sem fidelidade · Sem taxa de setup
              </p>

              {/* Feature list */}
              <div className="space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                {includedFeatures.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                      <Check
                        className="w-3 h-3 text-emerald-600 dark:text-emerald-400"
                        strokeWidth={2.5}
                      />
                    </div>
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
