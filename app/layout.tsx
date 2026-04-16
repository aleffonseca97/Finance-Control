import type { Metadata, Viewport } from 'next'
import { Inter, Outfit } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const outfit = Outfit({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-outfit',
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: 'Controle Financeiro Pessoal',
  description: 'Dashboard de controle financeiro pessoal',
  icons: {
    icon: '/logosfinance.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.className} ${outfit.variable} flex min-h-dvh flex-col antialiased`}>
        <main className="min-w-0 flex-1">
          <Providers>{children}</Providers>
        </main>
      </body>
    </html>
  )
}
