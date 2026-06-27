import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/localeFormat';

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

export function useAdminLearningPathLabels() {
  const { t, i18n } = useTranslation('learningPaths');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels: Record<string, string> = {
      ACTIVE: t('labels.status.ACTIVE'),
      INACTIVE: t('labels.status.INACTIVE'),
    };

    const fmtDate = (value?: string | null) => (
      value
        ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }, lang)
        : t('empty')
    );

    const getStatusLabel = (status: string) => statusLabels[status] || status;

    return {
      statusLabels,
      fmtDate,
      getStatusLabel,
      statusVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
