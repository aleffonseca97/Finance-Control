import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { ProfileForm } from '@/components/settings/profile-form'

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  })

  if (!user) redirect('/login')

  return (
    <div className="space-y-8 p-6 pt-8 md:p-8 md:pt-10">
      <div>
        <h1 className="text-2xl font-bold">Perfil</h1>
        <p className="text-muted-foreground">
          Edite suas informações pessoais e altere sua senha
        </p>
      </div>

      <ProfileForm name={user.name} email={user.email} />
    </div>
  )
}
