export const currencies = ['BRL', 'USD', 'EUR'] as const
export type AppCurrency = (typeof currencies)[number]

export const defaultCurrency: AppCurrency = 'BRL'

export function isAppCurrency(value: string): value is AppCurrency {
  return currencies.includes(value as AppCurrency)
}

export const currencyLabels: Record<AppCurrency, string> = {
  BRL: 'Real (R$)',
  USD: 'Dollar ($)',
  EUR: 'Euro (€)',
}
