// app/worldo/perfil/page.tsx
// Página /worldo/perfil: redireciona para o perfil público do usuário logado
// (/worldo/perfil/<publicId>).

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/constants/routes';

/** Redireciona para /login sem sessão ou para o perfil do usuário pelo publicId. */
export default async function PerfilRedirectPage() {
  const session = await auth();

  if (!session?.user) {
    redirect(ROUTES.login);
  }
  <div className="text-center py-12">Redirecionando para seu perfil...</div>;

  const publicId = session.user.publicId;
  redirect(ROUTES.profileOf(publicId));
}
