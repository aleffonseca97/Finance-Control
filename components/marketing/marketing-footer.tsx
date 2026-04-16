import Link from 'next/link'
import { APP_NAME, APP_VERSION } from '@/lib/version'

const currentYear = new Date().getFullYear()

export default function MarketingFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold select-none">L</span>
              </div>
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 [font-family:var(--font-outfit)]">
                {APP_NAME}
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[28ch] leading-relaxed">
              Dashboard financeiro pessoal para quem quer clareza sobre o próprio dinheiro.
            </p>
            <span className="font-mono text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded inline-block">
              v{APP_VERSION}
            </span>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
              Produto
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Funcionalidades', href: '#funcionalidades' },
                { label: 'Preços', href: '#precos' },
                { label: 'FAQ', href: '#faq' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Account links */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-4">
              Conta
            </h3>
            <ul className="space-y-2.5">
              {[
                { label: 'Criar conta', href: '/registro' },
                { label: 'Entrar', href: '/login' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400">
          <span>
            © {currentYear} {APP_NAME}. Todos os direitos reservados.
          </span>
        </div>
      </div>
    </footer>
  )
}
