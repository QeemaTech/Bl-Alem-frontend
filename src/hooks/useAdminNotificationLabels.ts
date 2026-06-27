import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/localeFormat';

const NOTIFICATION_TYPES = [
  'WELCOME', 'LIVE_SESSION', 'CERTIFICATE', 'REWARD', 'PAYMENT', 'COMMUNITY',
  'SUBSCRIPTION', 'EARNING', 'REVIEW', 'WITHDRAWAL', 'COURSE', 'INSTRUCTOR_REQUEST',
  'COURSE_REVIEW', 'SUPPORT', 'ADMIN',
] as const;

const ROLES = ['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN'] as const;

export function useAdminNotificationLabels() {
  const { t, i18n } = useTranslation('notifications');
  const lang = i18n.language;

  return useMemo(() => {
    const typeLabels = Object.fromEntries(
      NOTIFICATION_TYPES.map((key) => [key, t(`admin.labels.type.${key}`)]),
    ) as Record<string, string>;

    const roleLabels = Object.fromEntries(
      ROLES.map((key) => [key, t(`admin.labels.role.${key}`)]),
    ) as Record<string, string>;

    const readStatusLabels = {
      read: t('admin.labels.readStatus.read'),
      unread: t('admin.labels.readStatus.unread'),
    };

    const fmtNotificationDate = (value?: string | null) => (
      value
        ? formatDateTime(value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }, lang)
        : t('admin.empty')
    );

    const getTypeLabel = (type: string) => typeLabels[type] || type;
    const getRoleLabel = (role: string) => roleLabels[role] || role;
    const getReadStatusLabel = (isRead: boolean) => (
      isRead ? readStatusLabels.read : readStatusLabels.unread
    );

    return {
      typeLabels,
      roleLabels,
      readStatusLabels,
      fmtNotificationDate,
      getTypeLabel,
      getRoleLabel,
      getReadStatusLabel,
      empty: t('admin.empty'),
      lang,
    };
  }, [t, lang]);
}
