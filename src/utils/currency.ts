import i18n from '@/i18n';

export const DEFAULT_CURRENCY = 'EGP';

export const CURRENCY_OPTION_KEYS = [
  { labelKey: 'admin.options.currency.EGP', value: 'EGP' },
  { labelKey: 'admin.options.currency.SAR', value: 'SAR' },
  { labelKey: 'admin.options.currency.USD', value: 'USD' },
] as const;

/** @deprecated Use CURRENCY_OPTION_KEYS with i18n in settings */
export const CURRENCY_OPTIONS = [
  { label: 'جنيه مصري (ج.م)', value: 'EGP' },
  { label: 'ريال سعودي (ر.س)', value: 'SAR' },
  { label: 'دولار أمريكي ($)', value: 'USD' },
] as const;

const SYMBOLS_AR: Record<string, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  USD: '$',
};

const SYMBOLS_EN: Record<string, string> = {
  EGP: 'EGP',
  SAR: 'SAR',
  USD: 'USD',
};

function resolveLang(lang?: string) {
  const value = lang ?? i18n.language ?? 'ar';
  return value.startsWith('en') ? 'en' : 'ar';
}

export function getCurrencySymbol(code = DEFAULT_CURRENCY, lang?: string) {
  const map = resolveLang(lang) === 'en' ? SYMBOLS_EN : SYMBOLS_AR;
  return map[code] || map[DEFAULT_CURRENCY];
}

export function currencySuffix(code = DEFAULT_CURRENCY, lang?: string) {
  return `(${getCurrencySymbol(code, lang)})`;
}
