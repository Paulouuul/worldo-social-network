// components/VirtualizedPagedGrid.tsx
// Grade virtualizada com paginação sob demanda.
// - A altura do scroll é calculada a partir do `total` informado pela API.
// - Apenas as páginas que cobrem as linhas visíveis (+ meia página de folga) são buscadas.
// - Páginas que saem da tela perdem observadores e o React Query as remove da memória após `gcTime`.
'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { hashKey, useQueries, useQuery, type QueryKey } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface PageSlice<T> {
  items: T[];
  total: number;
}

export interface PagedSource<T, P> {
  /** Chave base (filtros incluídos). A página é acrescentada ao fim. */
  baseKey: QueryKey;
  pageSize: number;
  fetchPage: (page: number, signal: AbortSignal) => Promise<P>;
  select: (data: P) => PageSlice<T>;
  cache: { staleTime: number; gcTime: number; refetchOnMount?: boolean | 'always' };
  enabled?: boolean;
}

/** Opções de query de uma página. Exportado para que a tela possa ler a página 1 (ex.: dados do vendedor). */
export function pageQueryOptions<T, P>(source: PagedSource<T, P>, page: number) {
  return {
    queryKey: [...source.baseKey, 'page', page] as const,
    queryFn: ({ signal }: { signal: AbortSignal }) => source.fetchPage(page, signal),
    enabled: source.enabled ?? true,
    ...source.cache,
  };
}

interface Props<T, P> {
  source: PagedSource<T, P>;
  columnsForWidth: (width: number) => number;
  /** Altura da linha (card + espaçamento vertical) */
  rowHeight: (isMobile: boolean) => number;
  rowPadding?: string;
  getItemKey: (item: T) => string;
  renderItem: (item: T, page: P) => ReactNode;
  renderSkeleton: () => ReactNode;
  loadingState: ReactNode;
  emptyState: ReactNode;
}

function useViewport(columnsForWidth: (width: number) => number) {
  const [state, setState] = useState({ columns: 4, isMobile: false });

  useEffect(() => {
    const update = () => {
      const width = window.innerWidth;
      setState((prev) => {
        const next = { columns: columnsForWidth(width), isMobile: width < 640 };
        return prev.columns === next.columns && prev.isMobile === next.isMobile ? prev : next;
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [columnsForWidth]);

  return state;
}

export function VirtualizedPagedGrid<T, P>({
  source,
  columnsForWidth,
  rowHeight,
  rowPadding = '4px 8px 8px 8px',
  getItemKey,
  renderItem,
  renderSkeleton,
  loadingState,
  emptyState,
}: Props<T, P>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { columns, isMobile } = useViewport(columnsForWidth);
  const { pageSize, select } = source;

  // Página 1 define o total (e, portanto, a altura do scroll)
  const firstPage = useQuery(pageQueryOptions(source, 1));
  const total = firstPage.data ? select(firstPage.data).total : 0;
  const rowCount = Math.ceil(total / columns);
  const height = rowHeight(isMobile);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => height,
    overscan: 3,
  });

  useEffect(() => {
    rowVirtualizer.measure();
  }, [height, columns, rowVirtualizer]);

  // Volta ao topo quando os filtros mudam. O container é remontado após o loading e o
  // virtualizador tenta restaurar a posição antiga nele, então o reset espera o container existir.
  const baseHash = hashKey(source.baseKey);
  const [scrollResetFor, setScrollResetFor] = useState<string | null>(null);
  const hasContainer = !firstPage.isPending && total > 0;
  useEffect(() => {
    if (!hasContainer || scrollResetFor === baseHash) return;
    rowVirtualizer.scrollToOffset(0);
    setScrollResetFor(baseHash);
  }, [baseHash, hasContainer, scrollResetFor, rowVirtualizer]);
  // Até o reset acontecer, as linhas visíveis ainda refletem a posição antiga: não buscar páginas por elas
  const scrollReady = hasContainer && scrollResetFor === baseHash;

  const virtualRows = rowVirtualizer.getVirtualItems();
  const firstRow = virtualRows[0]?.index ?? 0;
  const lastRow = virtualRows[virtualRows.length - 1]?.index ?? 0;

  // Páginas necessárias para as linhas visíveis, com meia página de folga em cada lado
  const pages = useMemo(() => {
    if (!scrollReady || total === 0) return [];
    const margin = Math.floor(pageSize / 2);
    const firstItem = Math.max(0, firstRow * columns - margin);
    const lastItem = Math.min(total - 1, (lastRow + 1) * columns - 1 + margin);
    const result: number[] = [];
    for (
      let p = Math.floor(firstItem / pageSize) + 1;
      p <= Math.floor(lastItem / pageSize) + 1;
      p++
    ) {
      if (p !== 1) result.push(p);
    }
    return result;
  }, [scrollReady, firstRow, lastRow, columns, total, pageSize]);

  const pageResults = useQueries({
    queries: pages.map((page) => pageQueryOptions(source, page)),
  });

  const pageData = new Map<number, P | undefined>();
  if (firstPage.data) pageData.set(1, firstPage.data);
  pages.forEach((page, i) => pageData.set(page, pageResults[i]?.data));

  if (firstPage.isPending) return <>{loadingState}</>;
  if (total === 0) return <>{emptyState}</>;

  return (
    <div ref={containerRef} className="h-full overflow-y-auto scrollbar-hide">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
          minHeight: '100%',
        }}
      >
        {virtualRows.map((virtualRow) => {
          const cells: ReactNode[] = [];

          for (let col = 0; col < columns; col++) {
            const index = virtualRow.index * columns + col;
            if (index >= total) break;

            const page = Math.floor(index / pageSize) + 1;
            const data = pageData.get(page);

            if (!data) {
              cells.push(<div key={`skeleton-${index}`}>{renderSkeleton()}</div>);
              continue;
            }

            const item = select(data).items[index % pageSize];
            // Página já chegou mas tem menos itens (total mudou entre as buscas)
            if (!item) continue;

            cells.push(<div key={getItemKey(item)}>{renderItem(item, data)}</div>);
          }

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gap: '8px',
                padding: rowPadding,
              }}
            >
              {cells}
            </div>
          );
        })}
      </div>
    </div>
  );
}
