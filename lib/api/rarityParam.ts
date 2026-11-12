// lib/api/rarityParam.ts
// Leitura do filtro de raridades das rotas de API (?rarity=COMUM,RARO).

import { Rarity } from '@prisma/client';

/**
 * Converte o parâmetro `rarity` (raridades separadas por vírgula) na lista de raridades válidas,
 * sem repetição. Lista vazia significa "todas as raridades" (sem filtro); valores inválidos e
 * 'all' são ignorados.
 */
export function parseRarities(param: string | null): Rarity[] {
  if (!param) return [];
  const valid = new Set<string>(Object.values(Rarity));
  return [...new Set(param.split(',').map((r) => r.trim().toUpperCase()))].filter((r) =>
    valid.has(r),
  ) as Rarity[];
}
