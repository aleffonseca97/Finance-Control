'use client'

import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
        storageKey="controle-financeiro-theme"
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}
