'use client';

import { Link, usePathname } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  BarChart3,
  Menu,
  X,
  Settings,
  CreditCard,
  Receipt,
  Flag,
  ChevronDown,
  ChevronRight,
  User,
  Tags,
  PiggyBank as PiggyBankIcon,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Repeat,
  Table2,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';

type NavChild = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { href: '/dashboard', labelKey: 'overview', icon: LayoutDashboard },
  { href: '/dashboard/entradas', labelKey: 'incomes', icon: TrendingUp },
  { href: '/dashboard/saidas', labelKey: 'expenses', icon: TrendingDown },
  {
    href: '/dashboard/pagamentos-recorrentes',
    labelKey: 'recurrence',
    icon: Repeat,
    children: [
      { href: '/dashboard/pagamentos-recorrentes', labelKey: 'recurringPayments', icon: TrendingDown },
      { href: '/dashboard/recorrencia/investimentos', labelKey: 'recurringInvestments', icon: PiggyBank },
    ],
  },
  {
    href: '/dashboard/cartao-credito',
    labelKey: 'creditCard',
    icon: CreditCard,
  },
  {
    href: '/dashboard/investimentos',
    labelKey: 'investments',
    icon: PiggyBank,
    children: [
      { href: '/dashboard/investimentos', labelKey: 'investments', icon: PiggyBank },
      { href: '/dashboard/metas', labelKey: 'goals', icon: Flag },
    ],
  },
  {
    href: '/dashboard/analise',
    labelKey: 'analysis',
    icon: BarChart3,
    children: [
      { href: '/dashboard/analise', labelKey: 'analysisSummary', icon: BarChart3 },
      { href: '/dashboard/parcelamentos', labelKey: 'installments', icon: Receipt },
      { href: '/dashboard/tabela-anual', labelKey: 'annualTable', icon: Table2 },
    ],
  },
  {
    href: '/dashboard/configuracoes',
    labelKey: 'settings',
    icon: Settings,
    children: [
      { href: '/dashboard/configuracoes/perfil', labelKey: 'profile', icon: User },
      { href: '/dashboard/configuracoes/categorias', labelKey: 'categories', icon: Tags },
      { href: '/dashboard/configuracoes/investimentos', labelKey: 'investmentCategories', icon: PiggyBankIcon },
    ],
  },
];

const MOBILE_NAV_ID = 'dashboard-mobile-nav';
const SIDEBAR_COLLAPSED_KEY = 'finance-sidebar-collapsed';

export function Sidebar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isLg, setIsLg] = useState(false);
  const [configOpen, setConfigOpen] = useState(
    pathname.startsWith('/dashboard/configuracoes')
  );
  const [recurrenceOpen, setRecurrenceOpen] = useState(
    pathname.startsWith('/dashboard/pagamentos-recorrentes') ||
      pathname.startsWith('/dashboard/recorrencia/investimentos')
  );
  const [analiseOpen, setAnaliseOpen] = useState(
    pathname.startsWith('/dashboard/analise') ||
      pathname.startsWith('/dashboard/parcelamentos') ||
      pathname.startsWith('/dashboard/tabela-anual')
  );
  const [investimentosOpen, setInvestimentosOpen] = useState(
    pathname.startsWith('/dashboard/investimentos') || pathname.startsWith('/dashboard/metas')
  );

  const effectiveCollapsed = collapsed && isLg;

  const syncSidebarWidth = useCallback((narrow: boolean) => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.setProperty(
      '--dashboard-sidebar-width',
      narrow ? '4rem' : '16rem'
    );
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onMq = () => {
      const lg = mq.matches;
      setIsLg(lg);
      if (!lg) {
        document.documentElement.style.removeProperty('--dashboard-sidebar-width');
        return;
      }
      try {
        const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
        setCollapsed(stored === 'true');
      } catch {
        setCollapsed(false);
      }
    };
    onMq();
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  useEffect(() => {
    if (!isLg) return;
    syncSidebarWidth(collapsed);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed));
    } catch {
      /* ignore */
    }
  }, [collapsed, isLg, syncSidebarWidth]);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/configuracoes')) {
      setConfigOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/analise') ||
      pathname.startsWith('/dashboard/parcelamentos')
    ) {
      setAnaliseOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (
      pathname.startsWith('/dashboard/pagamentos-recorrentes') ||
      pathname.startsWith('/dashboard/recorrencia/investimentos')
    ) {
      setRecurrenceOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith('/dashboard/investimentos') || pathname.startsWith('/dashboard/metas')) {
      setInvestimentosOpen(true);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const toggleCollapsed = () => setCollapsed((c) => !c);

  const logoBlock = () => (
    <Link
      href="/dashboard"
      className="flex min-w-0 shrink flex-1 items-center gap-2"
      onClick={() => setOpen(false)}
    >
      <span className="relative flex h-9 w-[min(100%,11rem)] shrink-0 overflow-hidden">
        <Image
          src="/logosfinance-logomarca.png"
          alt={tCommon('appName')}
          width={220}
          height={48}
          className="h-9 w-auto max-w-none select-none object-contain object-left"
          priority
        />
      </span>
    </Link>
  );

  return (
    <>
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center gap-2 border-b border-border/80 bg-card/95 px-4 pb-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] shadow-sm backdrop-blur-sm supports-[backdrop-filter]:bg-card/80">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={MOBILE_NAV_ID}
          aria-label={open ? t('closeMenu') : t('openMenu')}
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </Button>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link href="/dashboard" className="relative block h-8 w-[140px] shrink-0" aria-label={t('brandHome')}>
            <Image
              src="/logosfinance-logomarca.png"
              alt={tCommon('appName')}
              fill
              className="object-contain object-left"
              sizes="140px"
              priority
            />
          </Link>
        </div>
      </header>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/50 lg:hidden motion-reduce:transition-none"
          onClick={() => setOpen(false)}
          aria-label={t('closeMenu')}
        />
      )}

      <aside
        id={MOBILE_NAV_ID}
        aria-label={t('mainNav')}
        className={cn(
          'fixed top-0 left-0 z-50 flex h-dvh w-64 max-w-[85vw] flex-col border-r border-border/80 bg-card shadow-xl transition-[width,transform] duration-200 ease-out motion-reduce:transition-none lg:translate-x-0',
          effectiveCollapsed && 'lg:w-16 lg:overflow-visible',
          !effectiveCollapsed && 'lg:w-64',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div
          className={cn(
            'flex items-center gap-2 border-b border-border/80 bg-muted/20 p-4',
            effectiveCollapsed ? 'lg:justify-center lg:px-2 lg:py-3' : 'justify-between',
          )}
        >
          {!effectiveCollapsed && logoBlock()}
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="hidden lg:inline-flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
              aria-pressed={collapsed}
            >
              {collapsed ? (
                <ChevronsRight className="h-5 w-5" aria-hidden />
              ) : (
                <ChevronsLeft className="h-5 w-5" aria-hidden />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(false)}
              aria-label={t('closeMenu')}
            >
              <X className="h-5 w-5" aria-hidden />
            </Button>
          </div>
        </div>
        <nav
          className={cn(
            'flex-1 min-h-0 space-y-1 p-4',
            effectiveCollapsed ? 'overflow-y-auto lg:overflow-visible' : 'overflow-y-auto',
          )}
          aria-label={t('sections')}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.labelKey);
            const hasChildren = 'children' in item && item.children;
            const isAnaliseSection = item.href === '/dashboard/analise';
            const isConfigSection = item.href === '/dashboard/configuracoes';
            const isInvestimentosSection = item.href === '/dashboard/investimentos';
            const isRecurrenceSection = item.href === '/dashboard/pagamentos-recorrentes';
            const isInvestimentosActive = pathname.startsWith('/dashboard/investimentos') || pathname.startsWith('/dashboard/metas');
            const isRecurrenceActive =
              pathname.startsWith('/dashboard/pagamentos-recorrentes') ||
              pathname.startsWith('/dashboard/recorrencia/investimentos');
            const isAnaliseActive =
              pathname.startsWith('/dashboard/analise') ||
              pathname.startsWith('/dashboard/parcelamentos');
            const isConfigActive = pathname.startsWith('/dashboard/configuracoes');
            const isParentActive =
              (isRecurrenceSection && isRecurrenceActive) ||
              (isInvestimentosSection && isInvestimentosActive) ||
              (isAnaliseSection && isAnaliseActive) ||
              (isConfigSection && isConfigActive);
            const isActive = !hasChildren && pathname === item.href;

            if (hasChildren && item.children) {
              const expanded = isAnaliseSection
                ? analiseOpen || isAnaliseActive
                : isRecurrenceSection
                  ? recurrenceOpen || isRecurrenceActive
                : isInvestimentosSection
                  ? investimentosOpen || isInvestimentosActive
                  : configOpen || isConfigActive;
              const toggleOpen = isAnaliseSection
                ? () => setAnaliseOpen(!analiseOpen)
                : isRecurrenceSection
                  ? () => setRecurrenceOpen(!recurrenceOpen)
                : isInvestimentosSection
                  ? () => setInvestimentosOpen(!investimentosOpen)
                  : () => setConfigOpen(!configOpen);

              if (effectiveCollapsed) {
                return (
                  <div
                    key={item.href}
                    className="group relative z-0 hover:z-50 focus-within:z-50"
                  >
                    <button
                      type="button"
                      aria-expanded={false}
                      className={cn(
                        'flex w-full min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium touch-manipulation transition-colors duration-200 motion-reduce:transition-none lg:justify-center lg:px-0',
                        isParentActive
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden />
                      <span className="sr-only">{label}</span>
                    </button>
                    <div
                      className={cn(
                        'pointer-events-none absolute left-full top-0 z-[100] hidden min-w-[12rem] pl-2',
                        'lg:left-[calc(100%+0.25rem)] lg:top-1/2 lg:-translate-y-1/2 lg:pl-0',
                        'lg:group-hover:pointer-events-auto lg:group-hover:block',
                        'lg:group-focus-within:pointer-events-auto lg:group-focus-within:block',
                      )}
                    >
                      <div className="rounded-[var(--dashboard-bento-radius)] border border-border/80 bg-card p-1 shadow-lg">
                        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">{label}</p>
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const childLabel = t(child.labelKey);
                          const isChildActive = pathname === child.href;
                          return (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => setOpen(false)}
                              className={cn(
                                'flex min-h-10 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium touch-manipulation transition-colors duration-200 motion-reduce:transition-none',
                                isChildActive
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                              )}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" aria-hidden />
                              {childLabel}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={toggleOpen}
                    aria-expanded={expanded}
                    className={cn(
                      'flex w-full min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium touch-manipulation transition-colors duration-200 motion-reduce:transition-none',
                      isParentActive
                        ? 'bg-primary/15 text-primary ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden />
                    {label}
                    {expanded ? (
                      <ChevronDown className="h-4 w-4 ml-auto shrink-0" aria-hidden />
                    ) : (
                      <ChevronRight className="h-4 w-4 ml-auto shrink-0" aria-hidden />
                    )}
                  </button>
                  {expanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-primary/15 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childLabel = t(child.labelKey);
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium touch-manipulation transition-colors duration-200 motion-reduce:transition-none',
                              isChildActive
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            )}
                          >
                            <ChildIcon className="h-4 w-4 shrink-0" aria-hidden />
                            {childLabel}
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
                title={effectiveCollapsed ? label : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium touch-manipulation transition-colors duration-200 motion-reduce:transition-none',
                  effectiveCollapsed && 'lg:justify-center lg:px-0',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden />
                <span className={cn(effectiveCollapsed && 'lg:sr-only')}>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            'border-t border-border/80 bg-muted/10 p-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] lg:pb-4',
            effectiveCollapsed && 'lg:px-2',
          )}
        >
          <Button
            variant="outline"
            className={cn(
              'w-full',
              effectiveCollapsed && 'lg:justify-center lg:px-0 lg:min-h-10',
            )}
            onClick={() => signOut({ callbackUrl: `/${locale}/login` })}
            aria-label={t('signOut')}
            title={effectiveCollapsed ? t('signOut') : undefined}
          >
            <LogOut className={cn('h-4 w-4 shrink-0', !effectiveCollapsed && 'mr-2')} />
            <span className={cn(effectiveCollapsed && 'lg:sr-only')}>{t('signOut')}</span>
          </Button>
        </div>
      </aside>
    </>
  );
}
