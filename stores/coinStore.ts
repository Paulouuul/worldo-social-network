// stores/coinStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CoinStore {
  balance: number;
  isLoading: boolean;
  lastUpdated: string | null;

  // Ações
  fetchBalance: () => Promise<void>;
  updateBalance: (newBalance: number) => void;
}

export const useCoinStore = create<CoinStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      isLoading: false,
      lastUpdated: null,

      fetchBalance: async () => {
        // Evita múltiplas requisições simultâneas
        if (get().isLoading) return;

        set({ isLoading: true });

        try {
          const res = await fetch('/api/coins/balance');
          const data = await res.json();

          set({
            balance: data.balance ?? 0,
            isLoading: false,
            lastUpdated: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Erro ao buscar saldo:', error);
          set({ isLoading: false });
        }
      },

      updateBalance: (newBalance: number) => {
        set({
          balance: newBalance,
          lastUpdated: new Date().toISOString(),
        });
      },
    }),
    {
      name: 'coin-storage', // chave no localStorage
      partialize: (state) => ({ balance: state.balance }),
    }
  )
);
