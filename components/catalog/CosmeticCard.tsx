// components/catalog/CosmeticCard.tsx
// Card padrão de cosmético nas grades (marketplace, loja do vendedor e inventário): fundo e borda
// da raridade, imagem da moldura, selo de raridade e nome, com etiquetas configuráveis no topo.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ClientImage } from '@/components/ClientImage';
import { getRarityDesigns } from '@/constants/cosmeticRarity';

/** Estilos por raridade com o selo posicionado logo abaixo da imagem. */
const rarityDesigns = getRarityDesigns('bottom-2');

/** Tamanhos: `md` para anúncios (cards maiores), `sm` para o inventário (grade mais densa). */
type CardSize = 'md' | 'sm';

const SIZES: Record<
  CardSize,
  {
    card: string;
    lift: string;
    top: string;
    imageWrap: string;
    image: string;
    imageHover: string;
    badge: string;
    footer: string;
    name: string;
  }
> = {
  md: {
    card: 'p-3 sm:p-4 h-62.5 sm:h-67.5',
    lift: 'hover:-translate-y-2',
    top: 'mb-2 gap-2',
    imageWrap: '',
    image: 'w-24 h-24 sm:w-28 sm:h-28',
    imageHover: 'group-hover:scale-110',
    badge: 'mt-1',
    footer: 'mt-auto pt-2',
    name: 'text-xs sm:text-sm',
  },
  sm: {
    card: 'p-2.5 sm:p-3 h-48 sm:h-52',
    lift: 'hover:-translate-y-1.5',
    top: 'mb-1 gap-1 min-h-6',
    imageWrap: 'flex flex-col items-center justify-center flex-1 w-full my-1',
    image: 'w-20 h-20 sm:w-22 sm:h-22 shrink-0',
    imageHover: 'group-hover:scale-105',
    badge: 'mt-1 mb-2',
    footer: 'pt-1.5',
    name: 'text-[10px] sm:text-xs',
  },
};

/** Propriedades do card. Use `href` para navegar ou `onClick` para ação na própria página. */
interface CosmeticCardProps {
  name: string;
  rarity: string;
  imageUrl: string;
  /** Atributo sizes da imagem (larguras por breakpoint). */
  imageSizes: string;
  size?: CardSize;
  href?: string;
  onClick?: () => void;
  /** Etiquetas à esquerda e à direita do topo do card. */
  topLeft?: ReactNode;
  topRight?: ReactNode;
  /** Linha extra abaixo do nome (ex.: vendedor). */
  footer?: ReactNode;
  /** Classes extras do card (ex.: destaque de item à venda). */
  className?: string;
}

/** Card de cosmético com as cores da raridade; vira link com `href` ou botão com `onClick`. */
export function CosmeticCard({
  name,
  rarity,
  imageUrl,
  imageSizes,
  size = 'md',
  href,
  onClick,
  topLeft,
  topRight,
  footer,
  className = '',
}: CosmeticCardProps) {
  const config = rarityDesigns[rarity?.toUpperCase()] || rarityDesigns.COMUM;
  const s = SIZES[size];
  const cardClass = `group relative w-full flex flex-col items-center justify-between rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${s.card} ${s.lift} ${config.cardClass} ${className}`;

  const image = (
    <div
      className={`relative rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 shadow-xl ${s.image} ${s.imageHover} ${config.borderClass}`}
    >
      <ClientImage
        src={imageUrl}
        alt={name}
        fill
        className="object-cover drop-shadow-2xl"
        sizes={imageSizes}
      />
    </div>
  );

  const content = (
    <>
      {config.bgDecoration}
      <div className="grid-overlay" />

      <div className={`w-full flex justify-between items-start z-20 ${s.top}`}>
        {topLeft ?? <span />}
        {topRight}
      </div>

      {s.imageWrap ? <div className={s.imageWrap}>{image}</div> : image}

      <div className={`relative w-full flex justify-center z-20 h-6 ${s.badge}`}>
        {config.badge}
      </div>

      <div
        className={`w-full z-10 border-t border-slate-800/40 flex flex-col items-center ${s.footer}`}
      >
        <span
          className={`block text-center px-1 truncate w-full drop-shadow-md ${s.name} ${config.textClass}`}
        >
          {name}
        </span>
        {footer}
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cardClass}>
      {content}
    </button>
  );
}
