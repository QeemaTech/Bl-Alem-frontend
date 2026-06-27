import { DEFAULT_CURRENCY, getCurrencySymbol } from '@/utils/currency';
import {
  formatDate,
  formatNumber,
  formatRelativeTimeMinutes,
} from '@/utils/localeFormat';

export function createDashboardFormatters(lang: string) {
  const fmtNum = (value: number) =>
    formatNumber(Number(value || 0), undefined, lang);

  const fmtMoney = (value: number, currencyCode = DEFAULT_CURRENCY) => {
    const num = Math.round(Number(value || 0) * 100) / 100;
    return `${formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(currencyCode, lang)}`;
  };

  const fmtPct = (value: number, signed = true) => {
    const n = Number(value || 0);
    const prefix = signed && n > 0 ? '+' : '';
    return `${prefix}${n.toFixed(1)}%`;
  };

  const fmtDateLong = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return formatDate(d, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }, lang);
  };

  const fmtTimeAgo = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    return formatRelativeTimeMinutes(mins, lang);
  };

  const getMonthLabels = (count = 12) => {
    const labels: string[] = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      labels.push(formatDate(d, { month: 'short' }, lang));
    }
    return labels;
  };

  return { fmtNum, fmtMoney, fmtPct, fmtDateLong, fmtTimeAgo, getMonthLabels };
}

export type DashboardFormatters = ReturnType<typeof createDashboardFormatters>;

import i18n from '@/i18n';

function getFmt() {
  return createDashboardFormatters(i18n.language);
}

export const fmtNum = (value: number) => getFmt().fmtNum(value);
export const fmtMoney = (value: number, currencyCode?: string) => getFmt().fmtMoney(value, currencyCode);
export const fmtPct = (value: number, signed?: boolean) => getFmt().fmtPct(value, signed);
export const fmtTimeAgo = (date: Date | string) => getFmt().fmtTimeAgo(date);
