// components/InventoryVirtualized.tsx
// Grade virtualizada do inventário: cards dos grupos de itens (por moldura ou por anúncio) com
// selos de "à venda" e "equipado".
'use client';

import { Store, CheckCircle, Package } from 'lucide-react';
import type { Rarity } from '@/constants/cosmeticRarity';
import { CosmeticCard } from '@/components/catalog/CosmeticCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuantityTag } from '@/components/ui/PriceTag';
import { VirtualizedPagedGrid, type PagedSource } from '@/components/VirtualizedPagedGrid';

/** Grupo do inventário retornado por /api/worldo/cosmetics/inventory/grouped. */
export interface GroupedItem {
  id: string;
  frameId: string;
  isListed: boolean;
  resalePrice: number | null;
  listingId?: string | null;
  isEquipped: boolean;
  equippedItemId: string | null;
  count: number;
  frame: {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    imageUrl: string;
    rarity: Rarity;
    stock: number;
  };
}

/** Página da API de inventário agrupado. */
export interface InventoryPage {
  items: GroupedItem[];
  pagination?: { totalItems: number };
}

/** Extrai itens e total de uma página do inventário para a grade. */
export const selectInventory = (page: InventoryPage) => ({
  items: page.items || [],
  total: page.pagination?.totalItems || 0,
});

/** Colunas da grade conforme a largura da janela (2 a 8). */
const columnsForWidth = (width: number) => {
  if (width < 480) return 2;
  if (width < 640) return 3;
  if (width < 768) return 4;
  if (width < 1024) return 5;
  if (width < 1280) return 7;
  return 8;
};

/** Altura da linha: card h-48/h-52 (192/208px) + 16px de espaçamento. */
const rowHeight = (isMobile: boolean) => (isMobile ? 192 : 208) + 16;

/** Card de esqueleto para itens de páginas ainda não carregadas. */
const ItemSkeleton = () => (
  <div className="h-48 sm:h-52 rounded-2xl bg-slate-900/50 border border-slate-800 animate-pulse" />
);

/** Selo pequeno no topo do card (à venda / equipado). */
const StatusTag = ({
  tone,
  icon: Icon,
  label,
}: {
  tone: 'emerald' | 'blue';
  icon: typeof Store;
  label: string;
}) => (
  <span
    className={`flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded tracking-wider uppercase shrink-0 border ${
      tone === 'emerald'
        ? 'text-emerald-300 bg-emerald-950/90 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
        : 'text-blue-300 bg-blue-950/90 border-blue-500/40 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
    }`}
  >
    <Icon className="w-2.5 h-2.5" />
    {label}
  </span>
);

/** Card de um grupo do inventário; abre o modal de ações ao clicar. */
const InventoryItem = ({
  item,
  onClick,
}: {
  item: GroupedItem;
  onClick: (item: GroupedItem) => void;
}) => (
  <CosmeticCard
    size="sm"
    onClick={() => onClick(item)}
    name={item.frame.name}
    rarity={item.frame.rarity}
    imageUrl={item.frame.thumbnailUrl}
    imageSizes="(max-width: 640px) 72px, 88px"
    className={
      item.isListed ? 'ring-1 ring-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.08)]' : ''
    }
    topLeft={
      <div className="flex flex-col gap-1">
        {item.isListed && <StatusTag tone="emerald" icon={Store} label="Venda" />}
        {item.isEquipped && <StatusTag tone="blue" icon={CheckCircle} label="Equipado" />}
      </div>
    }
    topRight={<QuantityTag value={item.count} />}
  />
);

/** Propriedades da grade: fonte paginada e callback de clique no item. */
interface Props {
  source: PagedSource<GroupedItem, InventoryPage>;
  onItemClick: (item: GroupedItem) => void;
}

/** Grade do inventário sobre o VirtualizedPagedGrid, com esqueletos e estado vazio. */
export function InventoryVirtualized({ source, onItemClick }: Props) {
  return (
    <VirtualizedPagedGrid
      source={source}
      columnsForWidth={columnsForWidth}
      rowHeight={rowHeight}
      rowPadding="4px 8px"
      getItemKey={(item) => item.id}
      renderItem={(item) => <InventoryItem item={item} onClick={onItemClick} />}
      renderSkeleton={ItemSkeleton}
      loadingState={
        <div className="grid grid-cols-2 min-[480px]:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-5">
          {[...Array(12)].map((_, i) => (
            <ItemSkeleton key={i} />
          ))}
        </div>
      }
      emptyState={
        <EmptyState
          icon={Package}
          title="Seu inventário está vazio"
          description="Adquira no marketplace ou crie sua própria moldura!"
        />
      }
    />
  );
}
