import { useTranslation } from 'react-i18next';

export function useLandingLocale() {
  const { t, i18n } = useTranslation('landing');
  const lang = (i18n.resolvedLanguage || i18n.language || 'ar').startsWith('en') ? 'en' : 'ar';
  const isArabic = lang === 'ar';
  const dir: 'rtl' | 'ltr' = isArabic ? 'rtl' : 'ltr';

  return { t, i18n, lang, isArabic, dir };
}
