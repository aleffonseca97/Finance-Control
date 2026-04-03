import { RedefinirSenhaForm } from './redefinir-senha-form'

export default function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const raw = searchParams.token
  const token = typeof raw === 'string' ? raw : ''
  return <RedefinirSenhaForm token={token} />
}
