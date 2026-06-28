import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { InstructorNotification } from '../components/instructor/notifications/types';
import { localizedText } from '../utils/localizedContent';
import { formatDateTime } from '../utils/localeFormat';

export function useInstructorNotificationLabels() {
  const { t, i18n } = useTranslation('notifications');
  const lang = i18n.language;

  const typeLabel = useCallback(
    (type: string) => t(`instructor.labels.type.${type}`, { defaultValue: type || t('instructor.labels.fallbackType') }),
    [t, lang],
  );

  const notificationTitle = useCallback(
    (item: InstructorNotification) => localizedText({ ar: item.titleAr, en: item.titleEn }, lang),
    [lang],
  );

  const notificationBody = useCallback(
    (item: InstructorNotification) => localizedText({ ar: item.bodyAr, en: item.bodyEn }, lang),
    [lang],
  );

  const fmtRelative = useCallback((value: string) => {
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return t('instructor.time.now');
    if (mins < 60) return t('instructor.time.minutesAgo', { count: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('instructor.time.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return t('instructor.time.daysAgo', { count: days });
    return formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }, lang);
  }, [t, lang]);

  return useMemo(() => ({
    lang,
    typeLabel,
    notificationTitle,
    notificationBody,
    fmtRelative,
  }), [lang, typeLabel, notificationTitle, notificationBody, fmtRelative]);
}
