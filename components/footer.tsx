import { getTranslations } from 'next-intl/server'
import { APP_VERSION } from '@/lib/version'

export async function Footer() {
  const t = await getTranslations('common')

  return (
    <footer
      data-site-footer
      className="border-t border-border bg-card/50 py-4"
    >
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>{t('appName')}</span>
        <span className="font-mono text-xs bg-muted/50 px-2 py-1 rounded">
          v{APP_VERSION}
        </span>
      </div>
    </footer>
  )
}
