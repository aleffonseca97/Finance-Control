/**
 * Screenshots section — image placeholders.
 * When photos are ready, replace each <div id="screenshot-*"> with a <next/image> component.
 * Recommended sizes:
 *   screenshot-dashboard: 1200×750 (aspect 16/10)
 *   screenshot-transactions: 600×450 (aspect 4/3)
 *   screenshot-analysis: 600×450 (aspect 4/3)
 */

function PlaceholderSlot({
  id,
  label,
  className,
}: {
  id: string
  label: string
  className?: string
}) {
  return (
    <div
      id={id}
      className={`rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 flex items-center justify-center ${className ?? ''}`}
    >
      {/* Replace this div's contents with next/image when photos are available */}
      <div className="text-center text-zinc-400 dark:text-zinc-600 p-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 flex items-center justify-center">
          <span className="text-xl font-extralight leading-none">+</span>
        </div>
        <span className="text-sm">{label}</span>
      </div>
    </div>
  )
}

export default function ScreenshotsSection() {
  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header — centered for visual balance in this section */}
        <div className="max-w-xl mx-auto text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            Veja em ação
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 [font-family:var(--font-outfit)] leading-tight">
            Interface construída para clareza.
          </h2>
        </div>

        {/* Asymmetric grid: large primary + 2 smaller */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          <PlaceholderSlot
            id="screenshot-dashboard"
            label="Imagem do dashboard principal"
            className="aspect-[16/10] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
          />
          <div className="grid grid-cols-1 gap-4">
            <PlaceholderSlot
              id="screenshot-transactions"
              label="Transações"
              className="aspect-[4/3] bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5"
            />
            <PlaceholderSlot
              id="screenshot-analysis"
              label="Análises e gráficos"
              className="aspect-[4/3] bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
