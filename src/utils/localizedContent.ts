import i18n from '@/i18n';

export function resolveContentLang(lang?: string): 'ar' | 'en' {
  const value = lang ?? i18n.language ?? 'ar';
  return value.startsWith('en') ? 'en' : 'ar';
}

export function localizedText(
  fields: { ar?: string | null; en?: string | null },
  lang?: string,
  empty = '—',
): string {
  const l = resolveContentLang(lang);
  const ar = fields.ar?.trim() || '';
  const en = fields.en?.trim() || '';
  if (l === 'en') return en || ar || empty;
  return ar || en || empty;
}

export function localizedCourseTitle(
  course?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: course?.titleAr, en: course?.titleEn }, lang);
}

export function localizedCategoryName(
  category?: { nameAr?: string | null; nameEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: category?.nameAr, en: category?.nameEn }, lang);
}

export function localizedPathTitle(
  path?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: path?.titleAr, en: path?.titleEn }, lang);
}
