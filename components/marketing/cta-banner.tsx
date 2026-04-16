import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CtaBanner() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary px-8 py-16 md:px-16 text-center relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/2 pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 rounded-full bg-white/3 -translate-y-1/2 pointer-events-none" />

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-white [font-family:var(--font-outfit)] mb-4">
              Pronto para organizar
              <br />
              suas finanças?
            </h2>
            <p className="text-primary-foreground/75 mb-8 max-w-md mx-auto text-base leading-relaxed">
              Comece com 3 meses grátis. Sem complicação, sem surpresa.
            </p>
            <Button size="lg" variant="secondary" asChild className="text-base font-semibold group">
              <Link href="/registro">
                Criar conta gratuita
                <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <p className="text-primary-foreground/50 text-xs mt-4">
              Cancele quando quiser · Sem fidelidade
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
