// hooks/queries/useMe.ts
// Hook do perfil do usuário logado (/api/worldo/me).
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { fetchJson } from '@/lib/fetcher';
import { qk } from '@/lib/query-keys';
import type { Rarity } from '@/constants/cosmeticRarity';

/** Perfil do usuário logado retornado por /api/worldo/me. */
export interface Me {
  id: string;
  publicId: string;
  email: string;
  name: string;
  username: string;
  avatar: string | null;
  coverImage: string | null;
  bio: string;
  location: string;
  website: string;
  equippedFrame: { id: string; name: string; imageUrl: string; rarity: Rarity } | null;
  hasPassword: boolean;
  isOAuth: boolean;
  provider: string;
}

/**
 * Perfil do usuário logado. Fica em cache sem expirar e é atualizado via setQueryData (edição
 * de perfil) ou invalidação (equipar/desequipar moldura). Só busca com sessão autenticada.
 */
export function useMe() {
  const { status } = useSession();

  return useQuery({
    queryKey: qk.me(),
    queryFn: ({ signal }) => fetchJson<Me>('/api/worldo/me', { signal }),
    enabled: status === 'authenticated',
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
