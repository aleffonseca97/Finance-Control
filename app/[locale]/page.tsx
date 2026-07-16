import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getUserLocale } from '@/app/actions/locale'
import { LandingPage } from '@/components/marketing/landing-page'

export default async function HomePage() {
  const session = await auth()
  if (session?.user) {
    const locale = await getUserLocale(session.user.id)
    redirect(`/${locale}/dashboard`)
  }
  return <LandingPage />
}
