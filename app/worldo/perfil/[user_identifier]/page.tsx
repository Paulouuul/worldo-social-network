import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { ClientImage } from '@/components/ClientImage';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AvatarWithFrame } from '@/components/AvatarWithFrame';
import { RARITY } from '@/constants/cosmeticRarity';
import { ProfileBio } from '@/components/ProfileBio';
import {
  Pencil,
  MapPin,
  Link as LinkIcon,
  Calendar,
  User as UserIcon,
  Mail,
  Sparkles,
  Users,
  UserCheck,
  Package,
  MessageSquare,
  Star,
  Image as ImageIcon,
} from 'lucide-react';

interface ProfilePageProps {
  params: Promise<{
    user_identifier: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }
  const { user_identifier } = await params;
  const decodedUsername = decodeURIComponent(user_identifier);

  const user = await prisma.users.findFirst({
    where: {
      OR: [{ publicId: decodedUsername }, { username: decodedUsername }],
    },
    select: {
      id: true,
      publicId: true,
      name: true,
      username: true,
      email: true,
      bio: true,
      avatar: true,
      coverImage: true,
      location: true,
      website: true,
      equippedProfileFrameId: true,
      equippedFrame: { select: { imageUrl: true, rarity: true } },
      followersCount: true,
      followingCount: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const isOwnProfile = session?.user?.publicId === user.publicId;

  const memberSince = new Date(user.createdAt).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
  });

  const validWebsite = user.website?.startsWith('http') ? user.website : `https://${user.website}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 antialiased text-slate-100 selection:bg-purple-500/30">
      {/* Card Principal do Perfil */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl relative">
        {/* Imagem de Capa (Cover Image) */}
        <div className="relative h-40 sm:h-52 md:h-64 w-full bg-linear-to-r from-slate-950 via-purple-950/40 to-slate-950 border-b border-slate-800/50 overflow-hidden">
          {user.coverImage ? (
            <ClientImage
              src={user.coverImage}
              alt="Capa do Perfil"
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950"></div>
              <div className="relative z-10 flex flex-col items-center gap-2 opacity-30">
                <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                <p className="text-[10px] sm:text-xs font-medium tracking-widest uppercase">Espaço da Capa</p>
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo de Informações e Foto */}
        <div className="relative px-4 sm:px-6 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 md:-mt-20 mb-4 sm:mb-6 gap-3 sm:gap-4">
            {/* Bloco do Avatar */}
            <div className="relative shrink-0">
              <AvatarWithFrame
                avatarUrl={user.avatar && user.avatar !== 'None' ? user.avatar : null}
                name={session?.user?.name}
                frameUrl={user.equippedFrame?.imageUrl}
                className="w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36"
                rarity={user.equippedFrame?.rarity || RARITY.COMUM}
                priority
              />
            </div>

            {/* Ações (Editar Perfil) */}
            <div className="pt-1 sm:pt-0 self-start sm:self-end">
              {isOwnProfile && (
                <Link
                  href="/worldo/perfil/edit"
                  className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-slate-800 border border-slate-700/60 hover:bg-slate-700/80 text-slate-200 transition-all shadow-lg active:scale-[0.98]"
                >
                  <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
                  <span className="hidden xs:inline">Editar Perfil</span>
                  <span className="xs:hidden">Editar</span>
                </Link>
              )}
            </div>
          </div>

          {/* Dados Textuais do Usuário */}
          <div className="space-y-4 sm:space-y-6">
            <div className="space-y-1.5 sm:space-y-2">
              <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2 wrap-break-word">
                <span>{user.name}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 min-w-0">
                  <UserIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
                  <span className="text-slate-300 break-all">
                    @{user.username}
                  </span>
                </div>

                {isOwnProfile && (
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-purple-500/5 border border-purple-500/10 rounded-lg px-2 sm:px-2.5 py-0.5 text-[10px] sm:text-xs text-purple-400 min-w-0">
                    <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                    <span className="truncate max-w-24 sm:max-w-37.5 md:max-w-50">{user.email}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-widest bg-purple-500/10 border border-purple-500/20 px-1 rounded shrink-0">
                      Privado
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cards de Métricas e Estatísticas */}
            <div className="flex flex-wrap gap-2 sm:gap-4">
              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 text-center min-w-20 sm:min-w-27.5 flex-1 sm:flex-initial backdrop-blur-sm shadow-inner transition-colors hover:border-slate-800">
                <span className="block font-black text-lg sm:text-2xl text-purple-400 tracking-tight">
                  {user.followersCount}
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                  <span className="hidden xs:inline">Seguidores</span>
                  <span className="xs:hidden">Seg.</span>
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 text-center min-w-20 sm:min-w-27.5 flex-1 sm:flex-initial backdrop-blur-sm shadow-inner transition-colors hover:border-slate-800">
                <span className="block font-black text-lg sm:text-2xl text-purple-400 tracking-tight">
                  {user.followingCount}
                </span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                  <UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                  <span className="hidden xs:inline">Seguindo</span>
                  <span className="xs:hidden">Seg.</span>
                </span>
              </div>

              <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl px-3 sm:px-5 py-2.5 sm:py-3 text-center min-w-20 sm:min-w-27.5 flex-1 sm:flex-initial backdrop-blur-sm shadow-inner transition-colors hover:border-slate-800">
                <span className="block font-black text-lg sm:text-2xl text-slate-500 tracking-tight">0</span>
                <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1 mt-0.5">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> 
                  <span className="hidden xs:inline">Cosméticos</span>
                  <span className="xs:hidden">Cosm.</span>
                </span>
              </div>
            </div>

            {/* Caixa de Biografia Interativa */}
            {user.bio && (
              <div className="pt-1">
                <ProfileBio bio={user.bio} />
              </div>
            )}

            {/* Localização, Website e Data de Criação */}
            <div className="flex flex-wrap gap-x-4 sm:gap-x-6 gap-y-2 sm:gap-y-3 pt-1 sm:pt-2 text-[10px] sm:text-xs font-semibold text-slate-400 tracking-wide">
              {user.location && (
                <div className="flex items-start gap-1.5 sm:gap-2 bg-slate-950/30 border border-slate-800/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg max-w-full">
                  <MapPin className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span className="text-slate-400 wrap-break-word whitespace-pre-wrap">
                    {user.location}
                  </span>
                </div>
              )}

              {user.website && (
                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/30 border border-slate-800/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg max-w-full">
                  <LinkIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-400 shrink-0" />
                  <a
                    href={validWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 hover:underline truncate max-w-28 sm:max-w-37.5 md:max-w-62.5"
                  >
                    {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-950/30 border border-slate-800/40 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:ml-auto w-fit">
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-500 text-[9px] sm:text-xs whitespace-nowrap">
                  Membro desde <span className="text-slate-400">{memberSince}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navegação por Abas do Painel */}
      <div className="mt-6 sm:mt-8 space-y-4">
        <div className="flex gap-1 border-b border-slate-800/80 overflow-x-auto scrollbar-hide">
          <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-purple-400 border-b-2 border-purple-500 font-bold text-xs sm:text-sm tracking-wide whitespace-nowrap">
            <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Cosméticos</span>
          </button>

          <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-slate-400 hover:text-slate-200 font-semibold text-xs sm:text-sm tracking-wide transition whitespace-nowrap">
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Atividades</span>
          </button>

          <button className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-slate-400 hover:text-slate-200 font-semibold text-xs sm:text-sm tracking-wide transition whitespace-nowrap">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Favoritos</span>
          </button>
        </div>

        {/* Placeholder de Funcionalidades Futuras */}
        <div className="rounded-2xl border border-dashed border-slate-800 p-8 sm:p-12 text-center bg-slate-900/5">
          <p className="text-xs sm:text-sm font-medium text-slate-500 tracking-wide">
            Novas abas de customização e histórico serão liberadas em breve...
          </p>
        </div>
      </div>
    </div>
  );
}