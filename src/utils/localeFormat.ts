import i18n from '@/i18n';

const localeMap: Record<string, string> = {
  ar: 'ar-SA',
  en: 'en-US',
};

export function getLocaleTag(language?: string): string {
  const lang = language ?? i18n.language;
  return localeMap[lang] ?? localeMap.ar;
}

export function formatDate(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(getLocaleTag(language), options);
}

export function formatDateTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(getLocaleTag(language), options);
}

export function formatTime(
  value: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
  language?: string,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(getLocaleTag(language), options);
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  language?: string,
): string {
  return value.toLocaleString(getLocaleTag(language), options);
}

export function formatRelativeTimeMinutes(minutes: number, language?: string): string {
  const lang = language ?? i18n.language;
  if (minutes < 1) {
    return lang === 'en' ? 'Now' : 'الآن';
  }
  if (minutes < 60) {
    return lang === 'en' ? `${minutes}m ago` : `منذ ${minutes} د`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === 'en' ? `${hours}h ago` : `منذ ${hours} س`;
  }
  return formatDateTime(Date.now() - minutes * 60_000, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, language);
}
