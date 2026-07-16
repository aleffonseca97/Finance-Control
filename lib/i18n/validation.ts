import { getTranslations } from 'next-intl/server'

export async function getErrorTranslations() {
  return getTranslations('errors')
}

export async function getValidationTranslations() {
  return getTranslations('errors.validation')
}

export async function getServerErrorTranslations() {
  return getTranslations('errors.server')
}
