import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/localeFormat';

export const liveSessionStatusVariant = (status: string) => {
  if (status === 'LIVE') return 'live' as const;
  if (status === 'SCHEDULED') return 'info' as const;
  if (status === 'ENDED') return 'completed' as const;
  if (status === 'CANCELLED') return 'rejected' as const;
  return 'default' as const;
};

export function useAdminLiveSessionLabels() {
  const { t, i18n } = useTranslation('liveSessions');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels: Record<string, string> = {
      SCHEDULED: t('labels.status.SCHEDULED'),
      LIVE: t('labels.status.LIVE'),
      ENDED: t('labels.status.ENDED'),
      CANCELLED: t('labels.status.CANCELLED'),
    };

    const fmtDate = (value?: string | null) => (
      value
        ? formatDateTime(value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }, lang)
        : t('empty')
    );

    const fmtDurationShort = (minutes: number) => t('durationShort', { count: minutes });
    const fmtDurationMinutes = (minutes: number) => t('durationMinutes', { count: minutes });

    const getStatusLabel = (status: string) => statusLabels[status] || status;

    return {
      statusLabels,
      fmtDate,
      fmtDurationShort,
      fmtDurationMinutes,
      getStatusLabel,
      statusVariant: liveSessionStatusVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
