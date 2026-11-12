// components/cosmetics/cart/CartItemCard.tsx
// Peças compartilhadas entre carrinho e checkout: tipos do carrinho, cabeçalho das páginas de
// pedido e card de item com imagem, raridade, vendedor, preço e estoque.

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, type LucideIcon } from 'lucide-react';
import { ClientImage } from '@/components/ui/media/ClientImage';
import { PriceTag } from '@/components/ui/dataDisplay/PriceTag';
import { getRarityDesigns } from '@/constants/cosmeticRarity';
import { formatFullNumber } from '@/lib/utils/formatUtils';
import { ROUTES } from '@/constants/routes';

/** Item do carrinho com dados do anúncio. */
export interface CartItem {
  id: string;
  listing_id: string;
  frame_id: string;
  name: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
  image_url: string;
  thumbnail_url: string;
  max_quantity: number;
  total: number;
  frame?: {
    imageUrl: string;
    thumbnailUrl: string;
    rarity: string;
  };
  in_stock: boolean;
}

/** Carrinho com itens e totais. */
export interface CartData {
  user_id: string;
  total_items: number;
  total_price: number;
  unique_items_count: number;
  items: CartItem[];
}

/** Indica se o item está sem estoque (anúncio inativo ou esgotado). */
export const isItemOutOfStock = (item: CartItem) => !item.in_stock || item.max_quantity === 0;

/** Estilos por raridade na variante estática (selo abaixo da imagem). */
const rarityDesigns = getRarityDesigns('static');

/** Propriedades do cabeçalho das páginas de pedido. */
interface OrderPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: ReactNode;
  /** Link de voltar exibido à esquerda do título. */
  backHref?: string;
  actions?: ReactNode;
}

/** Título com ícone, subtítulo, link de voltar opcional e ações à direita. */
export function OrderPageHeader({
  icon: Icon,
  title,
  subtitle,
  backHref,
  actions,
}: OrderPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Voltar"
            className="text-slate-400 hover:text-slate-200 transition p-2 rounded-lg hover:bg-slate-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        )}
        <div>
          <h1 className="text-3xl font-black text-slate-200 flex items-center gap-3">
            <Icon className="w-8 h-8 text-purple-500" />
            {title}
          </h1>
          <p className="text-slate-400 text-sm mt-1">{subtitle}</p>
        </div>
      </div>
      {actions && <div className="flex gap-3 w-full sm:w-auto">{actions}</div>}
    </div>
  );
}

/** Propriedades do card de item. */
interface CartItemCardProps {
  item: CartItem;
  /** Nome vira link para o anúncio. */
  linkName?: boolean;
  /** Quantidade foi reduzida ao estoque disponível (borda de aviso). */
  adjusted?: boolean;
  /** Selos e informações abaixo do vendedor. */
  details?: ReactNode;
  /** Conteúdo à esquerda do rodapé (ex.: seletor de quantidade ou total). */
  footerStart?: ReactNode;
  /** Conteúdo ao final do rodapé, após o estoque (ex.: botão de remover). */
  footerEnd?: ReactNode;
}

/** Card do item com as cores da raridade; itens sem estoque ficam esmaecidos com borda vermelha. */
export function CartItemCard({
  item,
  linkName = false,
  adjusted = false,
  details,
  footerStart,
  footerEnd,
}: CartItemCardProps) {
  const config = rarityDesigns[item.frame?.rarity?.toUpperCase() || ''] || rarityDesigns.COMUM;
  const outOfStock = isItemOutOfStock(item);
  const nameClass = `font-bold text-lg sm:text-xl truncate block drop-shadow-md ${config.textClass}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 transition-all group border ${
        outOfStock
          ? 'border-red-500/30 opacity-60 grayscale-50'
          : adjusted
            ? 'border-amber-500/30'
            : config.cardClass || 'border-slate-800 bg-slate-900/50'
      }`}
    >
      {!outOfStock && config.bgDecoration}
      <div className="grid-overlay z-0" />

      <div className="relative z-10 flex flex-col sm:flex-row gap-5 sm:items-center">
        {/* Imagem e selo de raridade */}
        <div className="shrink-0 flex flex-col items-center">
          <div
            className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center shadow-xl transition-transform duration-500 sm:group-hover:scale-105 ${config.borderClass || 'border-slate-700'}`}
          >
            <ClientImage
              src={item.thumbnail_url || item.image_url}
              alt={item.name}
              fill
              className="object-cover drop-shadow-2xl"
              sizes="(max-width: 640px) 96px, 112px"
            />
          </div>
          <div className="relative w-full flex justify-center z-20 -mt-3 h-6">{config.badge}</div>
        </div>

        {/* Informações do item */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {linkName ? (
                <Link
                  href={ROUTES.listing(item.listing_id)}
                  className={`${nameClass} hover:underline transition`}
                >
                  {item.name}
                </Link>
              ) : (
                <p className={nameClass}>{item.name}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  <span className="truncate max-w-25 sm:max-w-37.5 font-medium">
                    {item.seller_name}
                  </span>
                </span>
              </div>

              {details}
            </div>

            <PriceTag value={item.price} size="lg" className="mt-2 sm:mt-0" />
          </div>

          {/* Rodapé */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/60">
            {footerStart}
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-block text-xs font-medium text-slate-400 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
                Estoque: {formatFullNumber(item.max_quantity)}
              </span>
              {footerEnd}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Selo de situação do item (sem estoque / quantidade ajustada). */
export function ItemStatusTag({ tone, children }: { tone: 'red' | 'amber'; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md mt-2 ${
        tone === 'red' ? 'text-red-400 bg-red-500/10' : 'text-amber-400 bg-amber-500/10'
      }`}
    >
      {children}
    </span>
  );
}
