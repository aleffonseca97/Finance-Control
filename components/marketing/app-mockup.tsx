import { cn } from '@/lib/utils'

const sidebarItems = ['Dashboard', 'Entradas', 'Saídas', 'Cartão', 'Metas', 'Análise']

const summaryCards = [
  { label: 'Receitas', value: 'R$5.200', color: 'text-emerald-600 dark:text-emerald-400' },
  { label: 'Despesas', value: 'R$1.847', color: 'text-red-500' },
  { label: 'Saldo', value: 'R$3.353', color: 'text-primary' },
]

const transactions = [
  { desc: 'Salário CLT', amount: '+R$5.200', color: 'text-emerald-600 dark:text-emerald-400' },
  { desc: 'Supermercado', amount: '-R$320', color: 'text-red-500' },
  { desc: 'Investimento', amount: '-R$500', color: 'text-primary' },
]

const barHeights = [40, 65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 95]

export default function AppMockup() {
  return (
    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.4)]">
      {/* Browser chrome */}
      <div className="h-8 bg-zinc-100 dark:bg-zinc-800 flex items-center gap-1.5 px-3 border-b border-zinc-200 dark:border-zinc-700">
        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        <div className="flex-1 mx-3 h-4 bg-white dark:bg-zinc-700 rounded border border-zinc-200 dark:border-zinc-600 flex items-center px-2">
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500 truncate">
            app.logosfinance.com/dashboard
          </span>
        </div>
      </div>

      {/* Dashboard layout */}
      <div className="flex bg-zinc-50 dark:bg-zinc-900" style={{ height: '340px' }}>
        {/* Sidebar */}
        <div className="w-36 bg-white dark:bg-zinc-900 border-r border-zinc-100 dark:border-zinc-800 p-3 flex flex-col gap-0.5 shrink-0">
          <div className="h-6 bg-primary/10 rounded-md flex items-center px-2 gap-1.5 mb-3">
            <div className="w-3 h-3 rounded bg-primary/40" />
            <div className="h-1.5 bg-primary/40 rounded w-16" />
          </div>
          {sidebarItems.map((item, i) => (
            <div
              key={item}
              className={cn(
                'h-7 rounded-md flex items-center px-2 gap-1.5',
                i === 0 ? 'bg-primary/10' : 'opacity-60'
              )}
            >
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded',
                  i === 0 ? 'bg-primary/50' : 'bg-zinc-200 dark:bg-zinc-700'
                )}
              />
              <span className="text-[9px] text-zinc-600 dark:text-zinc-300">{item}</span>
            </div>
          ))}
        </div>

        {/* Main area */}
        <div className="flex-1 p-3 space-y-2.5 overflow-hidden min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-200">
              Setembro 2025
            </span>
            <div className="h-4 w-16 bg-zinc-100 dark:bg-zinc-800 rounded text-[8px] flex items-center justify-center text-zinc-400">
              ← → mês
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-1.5">
            {summaryCards.map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-zinc-100 dark:border-zinc-700"
              >
                <div className="text-[8px] text-zinc-400 dark:text-zinc-500 mb-0.5">
                  {card.label}
                </div>
                <div className={cn('text-[11px] font-bold leading-none', card.color)}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-2.5 border border-zinc-100 dark:border-zinc-700">
            <div className="text-[8px] text-zinc-400 dark:text-zinc-500 mb-1.5">
              Evolução mensal
            </div>
            <div className="flex items-end gap-0.5 h-14">
              {barHeights.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm relative"
                  style={{ height: '100%' }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm bg-primary/20 dark:bg-primary/30"
                    style={{ height: '100%' }}
                  />
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm bg-primary/60 dark:bg-primary/70"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-white dark:bg-zinc-800 rounded-lg p-2 border border-zinc-100 dark:border-zinc-700">
            <div className="text-[8px] text-zinc-400 dark:text-zinc-500 mb-1.5">
              Transações recentes
            </div>
            {transactions.map((tx) => (
              <div
                key={tx.desc}
                className="flex justify-between items-center py-0.5"
              >
                <span className="text-[9px] text-zinc-600 dark:text-zinc-300">{tx.desc}</span>
                <span className={cn('text-[9px] font-semibold', tx.color)}>
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
