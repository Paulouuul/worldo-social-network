import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function PerfilRedirectPage() {
  const session = await auth()
  
  if (!session?.user) {
    return null;
    redirect('/teste')
  }
  <div className="text-center py-12">Redirecionando para seu perfil...</div>

  // Redireciona para o perfil usando publicId
  const publicId = session.user.publicId
  redirect(`/worldo/perfil/${publicId}`)
  
}