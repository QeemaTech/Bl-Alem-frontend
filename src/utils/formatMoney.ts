/** Format monetary values without floating-point display glitches. */
import i18n from '@/i18n';
import { DEFAULT_CURRENCY, getCurrencySymbol } from './currency';
import { formatNumber } from './localeFormat';

export function formatMoney(
  value: number | string | null | undefined,
  currencyCode = DEFAULT_CURRENCY,
  lang?: string,
) {
  const language = lang ?? i18n.language;
  const num = Math.round(Number(value || 0) * 100) / 100;
  const symbol = getCurrencySymbol(currencyCode, language);
  return `${formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, language)} ${symbol}`;
}

export function roundMoney(value: number | string | null | undefined) {
  return Math.round(Number(value || 0) * 100) / 100;
}
