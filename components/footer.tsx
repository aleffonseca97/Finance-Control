import { APP_VERSION, APP_NAME } from '@/lib/version'

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 py-4">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{APP_NAME}</span>
        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
          v{APP_VERSION}
        </span>
      </div>
    </footer>
  )
}
