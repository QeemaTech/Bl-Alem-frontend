export const STORAGE_KEY = 'bi-alem-language';

export const supportedLanguages = ['ar', 'en'] as const;
export type SupportedLanguage = (typeof supportedLanguages)[number];

export const defaultLanguage: SupportedLanguage = 'ar';

export function applyDocumentDirection(lang: string): void {
  const normalized = lang === 'en' ? 'en' : 'ar';
  document.documentElement.lang = normalized;
  document.documentElement.dir = normalized === 'ar' ? 'rtl' : 'ltr';
}

export function isSupportedLanguage(value: string | null): value is SupportedLanguage {
  return value === 'ar' || value === 'en';
}

export function readStoredLanguage(): SupportedLanguage {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isSupportedLanguage(stored)) return stored;
  } catch {
    /* ignore */
  }
  return defaultLanguage;
}
