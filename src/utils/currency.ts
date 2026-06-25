export const DEFAULT_CURRENCY = 'EGP';

export const CURRENCY_OPTIONS = [
  { label: 'جنيه مصري (ج.م)', value: 'EGP' },
  { label: 'ريال سعودي (ر.س)', value: 'SAR' },
  { label: 'دولار أمريكي ($)', value: 'USD' },
] as const;

const SYMBOLS: Record<string, string> = {
  EGP: 'ج.م',
  SAR: 'ر.س',
  USD: '$',
};

export function getCurrencySymbol(code = DEFAULT_CURRENCY) {
  return SYMBOLS[code] || SYMBOLS.EGP;
}

export function currencySuffix(code = DEFAULT_CURRENCY) {
  return `(${getCurrencySymbol(code)})`;
}
