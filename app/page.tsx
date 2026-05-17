import { auth } from '@/auth'
import Link from 'next/link'
import { LogoutButton } from '@/components/LogoutButton'

export default async function Home() {
  const session = await auth()
  const isLoggedIn = !!session

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
      {/* Banner/Botão de ação principal */}
      {!isLoggedIn ? (
        <div className="text-center mb-12">
          <div className="card-highlight p-8 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">🌟 Comece sua jornada agora!</h2>
            <p className="text-center text-lg mb-6">
              Crie sua conta e explore um mundo de possibilidades.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/register" className="btn-primary">
                Criar Conta
              </Link>
              <Link href="/login" className="btn-primary bg-green-600 hover:bg-green-700">
                Fazer Login&nbsp;&nbsp;<i className="bi bi-arrow-right-short"></i>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mb-12">
          <div className="card-highlight p-8 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">
              ✨ Bem-vindo de volta, {session.user?.name || session.user?.email?.split('@')[0]}! ✨
            </h2>
            <p className="text-center text-lg mb-6">
              Continue explorando nosso universo.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/perfil" className="btn-primary">
                Ir para meu Perfil
              </Link>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Cards de funcionalidades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="card-highlight p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🎨 Cosméticos</h2>
          <p>Crie e venda molduras exclusivas para personalizar seu perfil</p>
        </div>
        <div className="card-highlight p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">🪙 Moedas Virtuais</h2>
          <p>Adquira moedas e compre itens exclusivos na plataforma</p>
        </div>
        <div className="card-highlight p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">💬 Chat Social</h2>
          <p>Converse com amigos em chats privados ou em grupo</p>
        </div>
      </div>
    </div>
  )
}