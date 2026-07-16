import { revalidatePath } from 'next/cache'
import { getLocale } from 'next-intl/server'

export async function revalidateLocalePath(
  path: string,
  type?: 'layout' | 'page',
) {
  const locale = await getLocale()
  const normalized = path.startsWith('/') ? path : `/${path}`
  revalidatePath(`/${locale}${normalized}`, type)
}

export async function revalidateLocalePaths(
  paths: string[],
  type?: 'layout' | 'page',
) {
  const locale = await getLocale()
  for (const path of paths) {
    const normalized = path.startsWith('/') ? path : `/${path}`
    revalidatePath(`/${locale}${normalized}`, type)
  }
}
