// components/MarketplaceVirtualized.tsx
// Grade virtualizada de anúncios do marketplace (usada no marketplace e na loja do vendedor), com
// preço, estoque e selo de "adquirido".
'use client';

import { User, Sparkles } from 'lucide-react';
import type { Rarity } from '@/constants/cosmeticRarity';
import { CosmeticCard } from '@/components/catalog/CosmeticCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { PriceTag, QuantityTag } from '@/components/ui/PriceTag';
import { VirtualizedPagedGrid, type PagedSource } from '@/components/VirtualizedPagedGrid';
import { LoadingSpinner } from '@/components/Loading';

/** Anúncio exibido na grade. */
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

/** Formato mínimo de uma página de anúncios (marketplace e loja do vendedor). */
export interface ListingsPage<L extends MarketplaceListing = MarketplaceListing> {
  listings: L[];
  total: number;
  ownedFrameIds?: string[];
}

/** Extrai anúncios e total de uma página para a grade. */
export const selectListings = <L extends MarketplaceListing>(page: ListingsPage<L>) => ({
  items: page.listings || [],
  total: page.total || 0,
});

/** Set de molduras já adquiridas por página, calculado uma vez por resposta. */
const ownedCache = new WeakMap<object, Set<string>>();
/** Retorna (e memoriza) o Set de ownedFrameIds da página. */
function ownedSet(page: ListingsPage<any>) {
  let set = ownedCache.get(page);
  if (!set) {
    set = new Set(page.ownedFrameIds || []);
    ownedCache.set(page, set);
  }
  return set;
}

/** Colunas da grade conforme a largura da janela (2 a 7). */
const columnsForWidth = (width: number) => {
  if (width < 480) return 2;
  if (width < 640) return 3;
  if (width < 768) return 4;
  if (width < 1024) return 5;
  if (width < 1280) return 6;
  return 7;
};

/** Altura da linha: card h-62.5/h-67.5 (250/270px) + 16px de espaçamento. */
const rowHeight = (isMobile: boolean) => (isMobile ? 250 : 270) + 16;

/** Card do anúncio com preço, quantidade (ou selo de adquirido) e vendedor; leva ao detalhe do anúncio. */
const MarketplaceItem = ({
  listing,
  isOwned,
}: {
  listing: MarketplaceListing;
  isOwned: boolean;
}) => (
  <CosmeticCard
    href={`/worldo/cosmetics/marketplace/${listing.id}`}
    name={listing.frame.name}
    rarity={listing.frame.rarity}
    imageUrl={listing.frame.thumbnailUrl || listing.frame.imageUrl}
    imageSizes="(max-width: 640px) 96px, 112px"
    topLeft={<PriceTag value={listing.priceCoins} />}
    topRight={
      isOwned ? (
        <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 font-black text-[9px] px-1.5 py-1 rounded-md shadow-lg backdrop-blur-md flex items-center uppercase shrink-0">
          ✓ Adquirido
        </span>
      ) : (
        <QuantityTag value={listing.quantity} />
      )
    }
    footer={
      <div className="flex items-center gap-1 text-[9px] text-slate-500 mt-0.5 truncate max-w-full">
        <User className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{listing.seller.name}</span>
      </div>
    }
  />
);

/** Card de esqueleto para anúncios de páginas ainda não carregadas. */
const ListingSkeleton = () => (
  <div className="h-62.5 sm:h-67.5 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
);

/** Propriedades da grade: fonte paginada e mensagem do estado vazio. */
interface Props<L extends MarketplaceListing, P extends ListingsPage<L>> {
  source: PagedSource<L, P>;
  emptyMessage?: string;
}

/** Grade de anúncios sobre o VirtualizedPagedGrid, com spinner inicial e estado vazio. */
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
      loadingState={<LoadingSpinner text="Carregando ofertas..." minHeightClass="min-h-100" />}
      emptyState={
        <EmptyState icon={Sparkles} title="Nenhuma oferta encontrada" description={emptyMessage} />
      }
    />
  );
}
