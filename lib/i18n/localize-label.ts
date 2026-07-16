import enMessages from '@/messages/en.json'
import itMessages from '@/messages/it.json'
import ptMessages from '@/messages/pt-BR.json'
import type { AppLocale } from '@/i18n/routing'

type Nested = Record<string, unknown>

function collectPtToLocale(
  from: Nested,
  to: Nested,
  out: Record<string, string>,
) {
  for (const key of Object.keys(from)) {
    const fromValue = from[key]
    const toValue = to[key]
    if (typeof fromValue === 'string' && typeof toValue === 'string') {
      out[fromValue] = toValue
      continue
    }
    if (
      fromValue &&
      typeof fromValue === 'object' &&
      toValue &&
      typeof toValue === 'object'
    ) {
      collectPtToLocale(fromValue as Nested, toValue as Nested, out)
    }
  }
}

const enByPt: Record<string, string> = {}
collectPtToLocale(
  ptMessages.common.defaultCategories as Nested,
  enMessages.common.defaultCategories as Nested,
  enByPt,
)

const itByPt: Record<string, string> = {}
collectPtToLocale(
  ptMessages.common.defaultCategories as Nested,
  itMessages.common.defaultCategories as Nested,
  itByPt,
)

const byLocale: Partial<Record<AppLocale, Record<string, string>>> = {
  en: enByPt,
  it: itByPt,
}

/** Translates seeded default category/group names stored in Portuguese. Custom names pass through. */
export function localizeStoredLabel(
  label: string | null | undefined,
  locale: AppLocale,
): string {
  if (!label) return ''
  if (locale === 'pt-BR') return label
  return byLocale[locale]?.[label] ?? label
}
