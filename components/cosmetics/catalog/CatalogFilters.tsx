// components/cosmetics/catalog/CatalogFilters.tsx
// Filtros das páginas de catálogo: busca + raridade na mesma linha e opções de ordenação.

'use client';

import { RARITY, type Rarity } from '@/constants/cosmeticRarity';
import { ChipButton } from '@/components/ui/buttons/ChipButton';
import { SearchBar } from '@/components/ui/forms/SearchBar';
import { SORT } from '@/constants/marketplace';

/** Raridades selecionáveis no filtro, na ordem de exibição. */
export const RARITY_FILTER_OPTIONS: Rarity[] = [
  RARITY.COMUM,
  RARITY.RARO,
  RARITY.EPICO,
  RARITY.LENDARIO,
];

/** Raridades selecionadas no filtro; lista vazia = todas (sem filtro de raridade). */
export type RaritySelection = Rarity[];

/**
 * Valor do parâmetro `rarity` das APIs: raridades selecionadas separadas por vírgula, sempre na
 * ordem de RARITY_FILTER_OPTIONS (a mesma seleção gera a mesma chave de cache). Vazio sem filtro.
 */
export function toRarityParam(selection: RaritySelection): string {
  return RARITY_FILTER_OPTIONS.filter((r) => selection.includes(r)).join(',');
}

/** Opção de ordenação. */
export interface SortOption {
  value: string;
  label: string;
}

/** Ordenações de anúncios (marketplace e loja do vendedor). */
export const LISTING_SORT_OPTIONS: SortOption[] = [
  { value: SORT.newest, label: 'Mais recentes' },
  { value: SORT.oldest, label: 'Mais antigos' },
  { value: SORT.priceAsc, label: 'Menor preço' },
  { value: SORT.priceDesc, label: 'Maior preço' },
];

/** Ordenações do inventário. */
export const INVENTORY_SORT_OPTIONS: SortOption[] = [
  { value: SORT.newest, label: 'Mais recentes' },
  { value: SORT.oldest, label: 'Mais antigos' },
];

/** Propriedades da linha de busca e raridade. */
interface CatalogFiltersProps {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearch: (value: string) => void;
  searchPlaceholder: string;
  rarities: RaritySelection;
  onRaritiesChange: (value: RaritySelection) => void;
}

/** Busca à esquerda e chips de raridade à direita (empilhados no mobile). */
export function CatalogFilters({
  searchInput,
  onSearchInputChange,
  onSearch,
  searchPlaceholder,
  rarities,
  onRaritiesChange,
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
      <RarityFilter value={rarities} onChange={onRaritiesChange} />
    </div>
  );
}

/**
 * Chips de raridade com seleção múltipla e rolagem horizontal.
 *
 * Cada raridade alterna entre marcada e desmarcada ao clicar. "Todas" limpa a seleção e fica ativo
 * apenas quando nenhuma raridade está marcada (sem filtro).
 */
export function RarityFilter({
  value,
  onChange,
}: {
  value: RaritySelection;
  onChange: (value: RaritySelection) => void;
}) {
  /** Marca a raridade se estiver desmarcada, ou desmarca se estiver marcada. */
  const toggle = (rarity: Rarity) =>
    onChange(value.includes(rarity) ? value.filter((r) => r !== rarity) : [...value, rarity]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
      <ChipButton active={value.length === 0} onClick={() => onChange([])}>
        Todas
      </ChipButton>
      {RARITY_FILTER_OPTIONS.map((rarity) => (
        <ChipButton key={rarity} active={value.includes(rarity)} onClick={() => toggle(rarity)}>
          {rarity}
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
