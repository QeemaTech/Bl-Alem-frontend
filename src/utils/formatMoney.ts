/** Format monetary values without floating-point display glitches. */
import { DEFAULT_CURRENCY, getCurrencySymbol } from './currency';

export function formatMoney(
  value: number | string | null | undefined,
  currencyCode = DEFAULT_CURRENCY,
) {
  const num = Math.round(Number(value || 0) * 100) / 100;
  const symbol = getCurrencySymbol(currencyCode);
  return `${num.toLocaleString('ar-EG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${symbol}`;
}

export function roundMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}
