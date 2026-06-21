// stores/cartSummaryStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { backendApiCall } from '@/lib/backendApiClient';
interface CartSummary {
  total_items: number;
  total_price: number;
  unique_items_count: number;
}

interface CartSummaryStore {
  summary: CartSummary | null;
  isLoading: boolean;
  lastUpdated: string | null;

  fetchSummary: () => Promise<void>;
  updateLocalSummary: (data: CartSummary) => void;
  resetSummary: () => void;
}

export const useCartSummaryStore = create<CartSummaryStore>()(
  persist(
    (set, get) => ({
      summary: null,
      isLoading: false,
      lastUpdated: null,

      fetchSummary: async () => {
        if (get().isLoading) return;

        set({ isLoading: true });

        try {
          const res = await backendApiCall('/cosmetics/marketplace/cart/get/summary', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });

          const data = await res.json();

          if (res.ok) {
            set({
              summary: {
                total_items: data.total_items || 0,
                total_price: data.total_price || 0,
                unique_items_count: data.unique_items_count || 0,
              },
              isLoading: false,
              lastUpdated: new Date().toISOString(),
            });
          } else {
            console.error('Erro ao buscar resumo do carrinho:', data.error);
            set({ isLoading: false });
          }
        } catch (error) {
          console.error('Erro ao buscar resumo do carrinho:', error);
          set({ isLoading: false });
        }
      },

      updateLocalSummary: (data: CartSummary) => {
        set({
          summary: data,
          lastUpdated: new Date().toISOString(),
        });
      },

      resetSummary: () => {
        set({
          summary: null,
          isLoading: false,
          lastUpdated: null,
        });
      },
    }),
    {
      name: 'cart-summary-storage',
      partialize: (state) => ({ summary: state.summary }),
    }
  )
);