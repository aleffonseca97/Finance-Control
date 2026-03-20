'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
  Menu,
  X,
  Wallet,
  Settings,
  CreditCard,
  Table2,
  ChevronDown,
  ChevronRight,
  User,
  Tags,
  PiggyBank as PiggyBankIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/dashboard', label: 'Visão Geral', icon: LayoutDashboard },
  { href: '/dashboard/entradas', label: 'Entradas', icon: TrendingUp },
  { href: '/dashboard/saidas', label: 'Saídas', icon: TrendingDown },
  {
    href: '/dashboard/cartao-credito',
    label: 'Cartão de Crédito',
    icon: CreditCard,
  },
  { href: '/dashboard/investimentos', label: 'Investimentos', icon: PiggyBank },
  {
    href: '/dashboard/analise',
    label: 'Análise',
    icon: BarChart3,
    children: [
      { href: '/dashboard/analise', label: 'Resumo', icon: BarChart3 },
      { href: '/dashboard/tabela-anual', label: 'Tabela Anual', icon: Table2 },
    ],
  },
  {
    href: '/dashboard/configuracoes',
    label: 'Configurações',
    icon: Settings,
    children: [
      { href: '/dashboard/configuracoes/perfil', label: 'Perfil', icon: User },
      { href: '/dashboard/configuracoes/categorias', label: 'Categorias', icon: Tags },
      { href: '/dashboard/configuracoes/investimentos', label: 'Investimentos', icon: PiggyBankIcon },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(
    pathname.startsWith('/dashboard/configuracoes')
  );
  const [analiseOpen, setAnaliseOpen] = useState(
    pathname.startsWith('/dashboard/analise') || pathname.startsWith('/dashboard/tabela-anual')
  );

  useEffect(() => {
    if (pathname.startsWith('/dashboard/configuracoes')) {
      setConfigOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/analise') || pathname.startsWith('/dashboard/tabela-anual')) {
      setAnaliseOpen(true);
    }
  }, [pathname]);

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-card border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="font-semibold">Financeiro</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </header>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-card border-r flex flex-col transition-transform duration-200 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="p-4 border-b flex items-center justify-between lg:justify-center">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <Wallet className="h-6 w-6 text-primary" />
            <span className="font-semibold">Financeiro</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = 'children' in item && item.children;
            const isAnaliseSection = item.href === '/dashboard/analise';
            const isConfigSection = item.href === '/dashboard/configuracoes';
            const isAnaliseActive = pathname.startsWith('/dashboard/analise') || pathname.startsWith('/dashboard/tabela-anual');
            const isConfigActive = pathname.startsWith('/dashboard/configuracoes');
            const isParentActive = (isAnaliseSection && isAnaliseActive) || (isConfigSection && isConfigActive);
            const isActive = !hasChildren && pathname === item.href;

            if (hasChildren && item.children) {
              const expanded = isAnaliseSection
                ? analiseOpen || isAnaliseActive
                : configOpen || isConfigActive;
              const toggleOpen = isAnaliseSection ? () => setAnaliseOpen(!analiseOpen) : () => setConfigOpen(!configOpen);
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={toggleOpen}
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                      isParentActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto" />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    )}
                  </button>
                  {expanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-muted pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex items-center gap-2 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                              isChildActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" />
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}
