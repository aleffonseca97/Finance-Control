import { getTranslations } from 'next-intl/server'

export default async function DashboardLoading() {
  const t = await getTranslations('common')

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="h-9 w-56 max-w-full animate-pulse rounded-lg bg-muted" />
        <div className="h-5 w-full max-w-md animate-pulse rounded-md bg-muted/70" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-[var(--dashboard-bento-radius)] border border-border/60 bg-muted/40"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-[var(--dashboard-bento-radius)] border border-border/60 bg-muted/30" />
        <div className="h-72 animate-pulse rounded-[var(--dashboard-bento-radius)] border border-border/60 bg-muted/30" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 animate-pulse rounded bg-muted/70" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className={
                i >= 4
                  ? 'hidden h-[6.5rem] animate-pulse flex-col items-center justify-center gap-2 rounded-[var(--dashboard-bento-radius)] border border-border/60 bg-muted/40 sm:flex'
                  : 'flex h-[5.25rem] animate-pulse flex-col items-center justify-center gap-1.5 rounded-[var(--dashboard-bento-radius)] border border-border/60 bg-muted/40 sm:h-[6.5rem] sm:gap-2'
              }
            >
              <div className="h-8 w-8 rounded-lg bg-muted sm:h-10 sm:w-10" />
              <div className="h-2.5 w-12 rounded bg-muted/70 sm:h-3 sm:w-14" />
              <div className="h-2 w-16 rounded bg-muted/50 sm:h-2.5 sm:w-20" />
            </div>
          ))}
        </div>
        <div className="mx-auto h-8 w-28 animate-pulse rounded-md bg-muted/50 sm:hidden" />
      </div>
      <p className="text-center text-sm text-muted-foreground">
        {t('loadingDashboard')}
      </p>
    </div>
  )
}
