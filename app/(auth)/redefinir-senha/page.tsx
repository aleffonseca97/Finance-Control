import { RedefinirSenhaForm } from './redefinir-senha-form'

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const raw = params.token
  const token = typeof raw === 'string' ? raw : ''

  return <RedefinirSenhaForm token={token} />
}