'use client'

import { createContext, useContext } from 'react'
import { defaultCurrency, type AppCurrency } from '@/lib/i18n/currency'

const CurrencyContext = createContext<AppCurrency>(defaultCurrency)

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: AppCurrency
  children: React.ReactNode
}) {
  return (
    <CurrencyContext.Provider value={currency}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency(): AppCurrency {
  return useContext(CurrencyContext)
}
