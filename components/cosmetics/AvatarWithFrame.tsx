// components/cosmetics/AvatarWithFrame.tsx
// Avatar do usuário com moldura cosmética sobreposta, brilho por raridade e inicial do nome
// quando não há foto.

import { ClientImage } from '@/components/ui/media/ClientImage';
import { RARITY, Rarity } from '@/constants/cosmeticRarity';
/** Propriedades do avatar: foto, nome (para a inicial), moldura, tamanho, raridade e brilho. */
interface AvatarWithFrameProps {
  avatarUrl?: string | null;
  name?: string;
  frameUrl?: string;
  size?: 'sm' | 'smsm' | 'md' | 'lg' | 'full';
  rarity?: Rarity | string;
  glowClass?: string;
  className?: string;
  priority?: boolean;
}

/** Gradiente de fundo da inicial conforme a raridade da moldura. */
const getInitialBgColor = (rarity?: Rarity | string) => {
  switch (rarity) {
    case RARITY.LENDARIO:
      return 'bg-gradient-to-br from-amber-500 to-orange-600';
    case RARITY.EPICO:
      return 'bg-gradient-to-br from-purple-600 to-pink-600';
    case RARITY.RARO:
      return 'bg-gradient-to-br from-blue-600 to-cyan-600';
    default:
      return 'bg-gradient-to-br from-purple-600 to-indigo-600';
  }
};

/** Brilho (drop-shadow) da moldura conforme a raridade, usado quando não há glowClass. */
const getDefaultGlowClass = (rarity?: Rarity | string) => {
  switch (rarity) {
    case RARITY.LENDARIO:
      return 'drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]';
    case RARITY.EPICO:
      return 'drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]';
    case RARITY.RARO:
      return 'drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]';
    default:
      return '';
  }
};

/** Renderiza o avatar (foto ou inicial) com a moldura por cima. */
export const AvatarWithFrame = ({
  avatarUrl,
  name,
  frameUrl,
  size = 'md',
  rarity,
  glowClass = '',
  className = 'w-32 h-32',
  priority = false,
}: AvatarWithFrameProps) => {
  const sizeClasses = {
    smsm: 'w-12 h-12',
    sm: 'w-16 h-16',
    md: 'w-32 h-32',
    lg: 'w-48 h-48',
    full: 'w-full h-full',
  };

  /** Tamanho da fonte da inicial para cada tamanho de avatar. */
  const getFontSize = (size?: 'sm' | 'smsm' | 'md' | 'lg' | 'full') => {
    const sizes = {
      smsm: '0.75rem',
      sm: '1rem',
      md: '2rem',
      lg: '3rem',
      full: 'clamp(2rem, 10vw, 6rem)',
    };
    return sizes[size || 'md'];
  };

  /** Primeira letra do nome em maiúscula, ou '?' sem nome. */
  const getInitial = () => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const bgColorClass = getInitialBgColor(rarity);
  const finalGlowClass = glowClass || getDefaultGlowClass(rarity);

  return (
    <div className={`relative ${size ? sizeClasses[size] : className}`}>
      {/* Foto do avatar ou inicial do nome */}
      <div className="absolute inset-[15%] z-0">
        {avatarUrl && avatarUrl !== 'None' && avatarUrl.startsWith('http') ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            {/* Fundo de fallback para imagens PNG com transparência */}
            <div className={`absolute inset-0 ${bgColorClass} rounded-full`} />
            <ClientImage
              src={avatarUrl}
              alt="Avatar do usuário"
              fill
              sizes="(max-width: 768px) 100px, 128px"
              className="object-cover"
              priority={priority}
            />
          </div>
        ) : (
          <div
            className={`w-full h-full rounded-full ${bgColorClass} flex items-center justify-center`}
          >
            <span
              className="font-bold text-white drop-shadow-md"
              style={{ fontSize: getFontSize(size) }}
            >
              {getInitial()}
            </span>
          </div>
        )}
      </div>

      {/* Moldura sobreposta */}
      {frameUrl && (
        <div className={`absolute inset-0 z-10 ${finalGlowClass}`}>
          <ClientImage
            src={frameUrl}
            alt="Moldura"
            fill
            sizes="(max-width: 768px) 120px, 160px"
            objectFit="contain"
            className="object-contain"
            priority={priority}
          />
        </div>
      )}
    </div>
  );
};
