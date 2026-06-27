import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { statusVariant } from '../components/admin/categories/categoryShared';
import { formatDate } from '../utils/localeFormat';

export function useAdminCategoryLabels() {
  const { t, i18n } = useTranslation('categories');
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
