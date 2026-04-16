'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/version'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold select-none">L</span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 [font-family:var(--font-outfit)]">
            {APP_NAME}
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Funcionalidades', href: '#funcionalidades' },
            { label: 'Preços', href: '#precos' },
            { label: 'FAQ', href: '#faq' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors duration-150"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/login">Entrar</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/registro">Começar grátis</Link>
          </Button>
          {/* Mobile menu toggle */}
          <button
            className="md:hidden ml-1 p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            <div className="space-y-1.5">
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition-transform duration-200 origin-center',
                  mobileOpen && 'translate-y-2 rotate-45'
                )}
              />
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition-opacity duration-200',
                  mobileOpen && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'block h-0.5 w-5 bg-current transition-transform duration-200 origin-center',
                  mobileOpen && '-translate-y-2 -rotate-45'
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'md:hidden overflow-hidden transition-all duration-200 ease-in-out border-t border-zinc-200 dark:border-zinc-800',
          'bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md',
          mobileOpen ? 'max-h-56' : 'max-h-0 border-transparent'
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {[
            { label: 'Funcionalidades', href: '#funcionalidades' },
            { label: 'Preços', href: '#precos' },
            { label: 'FAQ', href: '#faq' },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors"
            >
              Entrar
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
