// lib/format-utils.ts

/**
* Formata números grandes para exibição compacta
 * @example
 * formatItemCount(1000) → "1.0K"
 * formatItemCount(2500) → "2.5K"
 * formatItemCount(9999) → "10.0K"
 * formatItemCount(10000) → "10K"
 * formatItemCount(99999) → "100K"
 * formatItemCount(1000000) → "1.0M"
 * formatItemCount(2500000) → "2.5M"
 */
export function formatItemCount(count: number): string {
  if (count >= 1_000_000) {
    const value = count / 1_000_000;
    // Se for >= 10, mostra sem decimal (ex: 10M)
    if (value >= 10) {
      return Math.floor(value) + 'M';
    }
    // Se for < 10, mostra com 1 decimal (ex: 1.5M)
    return value.toFixed(1) + 'M';
  }
  
  if (count >= 1_000) {
    const value = count / 1_000;
    // Se for >= 10, mostra sem decimal (ex: 10K)
    if (value >= 10) {
      return Math.floor(value) + 'K';
    }
    // Se for < 10, mostra com 1 decimal (ex: 1.5K)
    return value.toFixed(1) + 'K';
  }
  
  return count.toString();
}

/**
 * Formata número completo com separadores
 * @example
 * formatFullNumber(1000000) → "1.000.000"
 * formatFullNumber(2500) → "2.500"
 */
export function formatFullNumber(count: number): string {
  return count.toLocaleString('pt-BR');
}

/**
 * Formata preço em moedas
 * @example
 * formatPrice(1000) → "1.000 Moedas"
 */
export function formatPrice(price: number): string {
  return `${price.toLocaleString('pt-BR')} Moedas`;
}
