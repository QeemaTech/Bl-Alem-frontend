import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { statusVariant } from '../components/admin/support/supportTicketShared';
import { formatDateTime } from '../utils/localeFormat';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'CLOSED'] as const;
const ROLES = ['STUDENT', 'INSTRUCTOR', 'SUPER_ADMIN'] as const;

export function useAdminSupportLabels() {
  const { t, i18n } = useTranslation('support');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels = Object.fromEntries(
      STATUSES.map((key) => [key, t(`admin.labels.status.${key}`)]),
    ) as Record<string, string>;

    const roleLabels = Object.fromEntries(
      ROLES.map((key) => [key, t(`admin.labels.role.${key}`)]),
    ) as Record<string, string>;

    const fmtSupportDate = (value?: string | null) => (
      value
        ? formatDateTime(value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }, lang)
        : ''
    );

    const getStatusLabel = (status: string) => statusLabels[status] || status;
    const getRoleLabel = (role: string) => roleLabels[role] || role;

    return {
      statusLabels,
      roleLabels,
      fmtSupportDate,
      getStatusLabel,
      getRoleLabel,
      statusVariant,
      lang,
    };
  }, [t, lang]);
}
