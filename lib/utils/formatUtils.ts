// lib/utils/formatUtils.ts
// Formatação de números e preços para exibição (padrão pt-BR).

/**
 * Formata números grandes de forma compacta (K/M), com uma casa decimal abaixo de 10.
 *
 * Exemplos: 2500 → "2.5K", 10000 → "10K", 2500000 → "2.5M".
 */
export function formatItemCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    if (value >= 10) {
      return Math.floor(value) + 'M';
    }
    return value.toFixed(1) + 'M';
  }

  if (count >= 1_000) {
    const value = count / 1_000;
    if (value >= 10) {
      return Math.floor(value) + 'K';
    }
    return value.toFixed(1) + 'K';
  }

  return count.toString();
}

/** Formata o número com separador de milhar pt-BR (ex.: 1000000 → "1.000.000"). */
export function formatFullNumber(count: number): string {
  return count.toLocaleString('pt-BR');
}

/** Formata o valor em moedas (ex.: 1000 → "1.000 Moedas"). */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('pt-BR')} Moedas`;
}
