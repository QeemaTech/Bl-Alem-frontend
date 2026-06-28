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

export function localizedCourseShortDescription(
  course?: { shortDescriptionAr?: string | null; shortDescriptionEn?: string | null } | null,
  lang?: string,
  fallback = '',
) {
  return localizedText(
    { ar: course?.shortDescriptionAr, en: course?.shortDescriptionEn },
    lang,
    fallback,
  );
}

export function localizedCourseDescription(
  course?: { descriptionAr?: string | null; descriptionEn?: string | null } | null,
  lang?: string,
  fallback = '',
) {
  return localizedText({ ar: course?.descriptionAr, en: course?.descriptionEn }, lang, fallback);
}

export function localizedCourseList(
  arItems?: string[] | null,
  enItems?: string[] | null,
  lang?: string,
): string[] {
  const l = resolveContentLang(lang);
  const ar = Array.isArray(arItems) ? arItems.filter(Boolean) : [];
  const en = Array.isArray(enItems) ? enItems.filter(Boolean) : [];
  if (l === 'en') return en.length ? en : ar;
  return ar.length ? ar : en;
}

export function localizedLessonTitle(
  lesson?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: lesson?.titleAr, en: lesson?.titleEn }, lang);
}

export function localizedLessonDescription(
  lesson?: { descriptionAr?: string | null; descriptionEn?: string | null } | null,
  lang?: string,
  fallback = '',
) {
  return localizedText({ ar: lesson?.descriptionAr, en: lesson?.descriptionEn }, lang, fallback);
}

export function localizedSectionTitle(
  section?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: section?.titleAr, en: section?.titleEn }, lang);
}

export function localizedQuizTitle(
  quiz?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: quiz?.titleAr, en: quiz?.titleEn }, lang);
}
export function localizedResourceTitle(
  resource?: { titleAr?: string | null; titleEn?: string | null; title?: string | null } | null,
  lang?: string,
) {
  return localizedText(
    { ar: resource?.titleAr || resource?.title, en: resource?.titleEn },
    lang,
  );
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

export function localizedPathDescription(
  path?: { descriptionAr?: string | null; descriptionEn?: string | null } | null,
  lang?: string,
  fallback = '',
) {
  return localizedText({ ar: path?.descriptionAr, en: path?.descriptionEn }, lang, fallback);
}

export function localizedSessionTitle(
  session?: { titleAr?: string | null; titleEn?: string | null } | null,
  lang?: string,
) {
  return localizedText({ ar: session?.titleAr, en: session?.titleEn }, lang);
}

export function localizedSessionDescription(
  session?: { descriptionAr?: string | null; descriptionEn?: string | null } | null,
  lang?: string,
  fallback = '',
) {
  return localizedText({ ar: session?.descriptionAr, en: session?.descriptionEn }, lang, fallback);
}
