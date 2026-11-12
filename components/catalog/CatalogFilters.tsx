// components/catalog/CatalogFilters.tsx
// Filtros das páginas de catálogo: busca + raridade na mesma linha e opções de ordenação.

'use client';

import { RARITY } from '@/constants/cosmeticRarity';
import { ChipButton } from '@/components/ui/ChipButton';
import { SearchBar } from '@/components/ui/SearchBar';

/** Opções de raridade do filtro ('all' = todas). */
export const RARITY_FILTER_OPTIONS = [
  'all',
  RARITY.COMUM,
  RARITY.RARO,
  RARITY.EPICO,
  RARITY.LENDARIO,
] as const;

/** Valor do filtro de raridade. */
export type RarityFilterValue = (typeof RARITY_FILTER_OPTIONS)[number];

/** Opção de ordenação. */
export interface SortOption {
  value: string;
  label: string;
}

/** Ordenações de anúncios (marketplace e loja do vendedor). */
export const LISTING_SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
];

/** Ordenações do inventário. */
export const INVENTORY_SORT_OPTIONS: SortOption[] = [
  { value: 'newest', label: 'Mais recentes' },
  { value: 'oldest', label: 'Mais antigos' },
];

/** Propriedades da linha de busca e raridade. */
interface CatalogFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  rarity: RarityFilterValue;
  onRarityChange: (value: RarityFilterValue) => void;
}

/** Busca à esquerda e chips de raridade à direita (empilhados no mobile). */
export function CatalogFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  searchPlaceholder,
  rarity,
  onRarityChange,
}: CatalogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4 shrink-0">
      <SearchBar
        className="flex-1"
        value={searchInput}
        onChange={onSearchInputChange}
        onSearch={onSearch}
        placeholder={searchPlaceholder}
      />
      <RarityFilter value={rarity} onChange={onRarityChange} />
    </div>
  );
}

/** Chips de raridade com rolagem horizontal. */
export function RarityFilter({
  value,
  onChange,
}: {
  value: RarityFilterValue;
  onChange: (value: RarityFilterValue) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
      {RARITY_FILTER_OPTIONS.map((option) => (
        <ChipButton key={option} active={value === option} onClick={() => onChange(option)}>
          {option === 'all' ? 'Todas' : option}
        </ChipButton>
      ))}
    </div>
  );
}

/** Propriedades da ordenação. */
interface SortSelectorProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Linha "Ordenar por" com um chip por opção. */
export function SortSelector({ options, value, onChange }: SortSelectorProps) {
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap shrink-0">
      <span className="text-xs text-slate-500 font-medium mr-2">Ordenar por:</span>
      {options.map((option) => (
        <ChipButton
          key={option.value}
          size="sm"
          active={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </ChipButton>
      ))}
    </div>
  );
}
