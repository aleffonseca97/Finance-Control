export default function DashboardLoading() {
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
      <p className="text-center text-sm text-muted-foreground">
        Carregando seu painel financeiro...
      </p>
    </div>
  )
}
