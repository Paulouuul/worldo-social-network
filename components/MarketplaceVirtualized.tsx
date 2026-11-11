// components/MarketplaceVirtualized.tsx
'use client';

import Link from 'next/link';
import { Coins, User, Sparkles } from 'lucide-react';
import { ClientImage } from '@/components/ClientImage';
import { formatItemCount } from '@/lib/format-utils';
import { getRarityDesigns, Rarity } from '@/constants/cosmeticRarity';
import { VirtualizedPagedGrid, type PagedSource } from '@/components/VirtualizedPagedGrid';

export interface MarketplaceListing {
  id: string;
  frameId: string;
  quantity: number;
  priceCoins: number;
  frame: {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    rarity: Rarity;
    creator: { name: string; username: string; avatar: string | null };
  };
  seller: { publicId: string; name: string; username: string; avatar: string | null };
}

/** Formato mínimo de uma página de listagens (marketplace e loja do vendedor). */
export interface ListingsPage<L extends MarketplaceListing = MarketplaceListing> {
  listings: L[];
  total: number;
  ownedFrameIds?: string[];
}

export const selectListings = <L extends MarketplaceListing>(page: ListingsPage<L>) => ({
  items: page.listings || [],
  total: page.total || 0,
});

// Set de itens adquiridos por página, calculado uma vez por resposta
const ownedCache = new WeakMap<object, Set<string>>();
function ownedSet(page: ListingsPage<any>) {
  let set = ownedCache.get(page);
  if (!set) {
    set = new Set(page.ownedFrameIds || []);
    ownedCache.set(page, set);
  }
  return set;
}

const columnsForWidth = (width: number) => {
  if (width < 480) return 2;
  if (width < 640) return 3;
  if (width < 768) return 4;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 7;
};

// Card: h-62.5 = 250px (mobile) | h-67.5 = 270px; +16px de espaçamento vertical
const rowHeight = (isMobile: boolean) => (isMobile ? 250 : 270) + 16;

const rarityDesigns = getRarityDesigns('bottom-2');

const MarketplaceItem = ({
  listing,
  isOwned,
}: {
  listing: MarketplaceListing;
  isOwned: boolean;
}) => {
  const config = rarityDesigns[listing.frame.rarity?.toUpperCase()] || rarityDesigns.COMUM;

  return (
    <Link
      href={`/worldo/cosmetics/marketplace/${listing.id}`}
      className={`group relative w-full flex flex-col items-center justify-between p-3 sm:p-4 h-62.5 sm:h-67.5 rounded-2xl border overflow-hidden transition-all duration-300 ease-out cursor-pointer hover:-translate-y-2 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${config.cardClass}`}
    >
      {config.bgDecoration}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-size-[0.4rem_0.4rem] opacity-[0.05]" />

      <div className="w-full flex justify-between items-start z-20 mb-2 gap-2">
        <span className="flex items-center gap-1 text-[10px] font-black text-amber-400 bg-amber-950/90 border border-amber-500/40 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.2)] tracking-wider backdrop-blur-sm">
          <Coins className="w-3 h-3" /> {formatItemCount(listing.priceCoins)}
        </span>

        {isOwned ? (
          <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-black text-[9px] px-1.5 py-1 rounded-md shadow-lg backdrop-blur-md flex items-center uppercase shrink-0">
            ✓ Adquirido
          </span>
        ) : (
          <span className="bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-slate-200 font-black text-[10px] px-2 py-1 rounded-md shadow-lg shrink-0">
            x{formatItemCount(listing.quantity)}
          </span>
        )}
      </div>

      <div
        className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border bg-slate-900/90 flex items-center justify-center z-10 transition-transform duration-500 group-hover:scale-110 shadow-xl ${config.borderClass}`}
      >
        <ClientImage
          src={listing.frame.thumbnailUrl || listing.frame.imageUrl}
          alt={listing.frame.name}
          fill
          className="object-cover drop-shadow-2xl"
          sizes="(max-width: 640px) 96px, 112px"
        />
      </div>

      <div className="relative w-full flex justify-center z-20 mt-1 h-6">{config.badge}</div>

      <div className="mt-auto w-full z-10 pt-2 border-t border-slate-800/40 flex flex-col items-center">
        <span
          className={`block text-xs sm:text-sm text-center px-1 truncate w-full drop-shadow-md ${config.textClass}`}
        >
          {listing.frame.name}
        </span>
        <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 truncate max-w-full">
          <User className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">{listing.seller.name}</span>
        </div>
      </div>
    </Link>
  );
};

const ListingSkeleton = () => (
  <div className="h-62.5 sm:h-67.5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
);

interface Props<L extends MarketplaceListing, P extends ListingsPage<L>> {
  source: PagedSource<L, P>;
  emptyMessage?: string;
}

export function MarketplaceVirtualized<L extends MarketplaceListing, P extends ListingsPage<L>>({
  source,
  emptyMessage = 'Não há molduras disponíveis no mercado no momento. Tente buscar por algo diferente!',
}: Props<L, P>) {
  return (
    <VirtualizedPagedGrid
      source={source}
      columnsForWidth={columnsForWidth}
      rowHeight={rowHeight}
      getItemKey={(listing) => listing.id}
      renderItem={(listing, page) => (
        <MarketplaceItem listing={listing} isOwned={ownedSet(page).has(listing.frame.id)} />
      )}
      renderSkeleton={ListingSkeleton}
      loadingState={
        <div className="flex justify-center items-center min-h-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
        </div>
      }
      emptyState={
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl border-dashed">
          <Sparkles className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
          <h3 className="text-lg sm:text-xl font-bold text-slate-300 mb-2">
            Nenhuma oferta encontrada
          </h3>
          <p className="text-sm text-slate-500 max-w-md">{emptyMessage}</p>
        </div>
      }
    />
  );
}
