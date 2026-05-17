import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth()
  const { username } = await params
  const decodedUsername = decodeURIComponent(username)
  
  const user = await prisma.users.findFirst({
    where: {
      OR: [
        { publicId: decodedUsername },
        { id: decodedUsername },
        { username: decodedUsername }
      ]
    },
    select: {
      id: true,
      publicId: true,
      name: true,
      username: true,
      email: true,
      image: true,
      bio: true,
      avatar: true,
      coverImage: true,
      location: true,
      website: true,
      equippedProfileFrameId: true,
      followersCount: true,
      followingCount: true,
      createdAt: true,
    }
  })

  if (!user) {
    notFound()
  }

  const isOwnProfile = session?.user?.id === user.id
  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long'
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Card principal */}
      <div className="card-highlight rounded-xl overflow-hidden">
        {/* Cover Image */}
        <div className="relative h-48 bg-gradient-to-r from-purple-900/80 to-indigo-900/80">
          {user.coverImage ? (
            <Image
              src={user.coverImage}
              alt="Cover"
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <span className="text-5xl opacity-50">✨</span>
                <p className="text-sm opacity-50 mt-2">Capa do perfil</p>
              </div>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="relative px-6 pb-6">
          {/* Avatar */}
          <div className="absolute -top-12 left-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-800 border-4 border-gray-800 shadow-lg">
              {user.avatar || user.image ? (
                <Image
                  src={user.avatar || user.image || ''}
                  alt={user.name || 'Avatar'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold bg-gradient-to-br from-purple-600 to-indigo-600">
                  {user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Edit Button */}
          <div className="flex justify-end pt-2">
            {isOwnProfile && (
              <Link href="/perfil/editar" className="btn-secondary text-sm">
                <i className="bi bi-pencil-square"></i>&nbsp;&nbsp;Editar Perfil
              </Link>
            )}
          </div>

          {/* User Info */}
          <div className="mt-12">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {user.name}
            </h1>
            <p className="text-gray-400 mt-1"><i className="bi bi-person-fill"></i> {user.username}
            <br/><i className="bi bi-envelope-at-fill"></i> {user.email}</p>
            
            {/* Stats Cards */}
            <div className="flex gap-4 mt-4">
              <div className="bg-gray-800/50 rounded-lg px-4 py-2 text-center min-w-[100px]">
                <span className="font-bold text-xl text-purple-400">{user.followersCount}</span>
                <p className="text-xs text-gray-400">seguidores</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-2 text-center min-w-[100px]">
                <span className="font-bold text-xl text-purple-400">{user.followingCount}</span>
                <p className="text-xs text-gray-400">seguindo</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg px-4 py-2 text-center min-w-[100px]">
                <span className="font-bold text-xl text-purple-400">0</span>
                <p className="text-xs text-gray-400">cosméticos</p>
              </div>
            </div>

            {/* Bio */}
            {user.bio && (
              <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
                <p className="italic">“{user.bio}”</p>
              </div>
            )}

            {/* Location & Website */}
            <div className="mt-4 space-y-1 text-sm text-gray-400">
              {user.location && (
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{user.location}</span>
                </div>
              )}
              {user.website && (
                <div className="flex items-center gap-2">
                  <span>🔗</span>
                  <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            {/* Member since */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500">
                🗓️ Membro desde {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Abas / Seções adicionais (opcional) */}
      <div className="mt-6">
        <div className="flex gap-2 border-b border-gray-700">
          <button className="px-4 py-2 text-purple-400 border-b-2 border-purple-400 font-medium">
            📦 Cosméticos
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-gray-300 transition">
            💬 Atividades
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-gray-300 transition">
            ⭐ Favoritos
          </button>
        </div>
        <div className="p-6 text-center text-gray-500">
          Em breve mais funcionalidades...
        </div>
      </div>
    </div>
  )
}