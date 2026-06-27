import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../utils/localeFormat';

const referralStatusVariant = (status: string) => {
  if (status === 'REWARDED' || status === 'APPROVED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

export function useAdminRewardLabels() {
  const { t, i18n } = useTranslation('rewards');
  const lang = i18n.language;

  return useMemo(() => {
    const referralStatusLabels: Record<string, string> = {
      PENDING: t('labels.referralStatus.PENDING'),
      APPROVED: t('labels.referralStatus.APPROVED'),
      REWARDED: t('labels.referralStatus.REWARDED'),
      REJECTED: t('labels.referralStatus.REJECTED'),
    };

    const codeStatusLabels = {
      active: t('labels.codeStatus.active'),
      disabled: t('labels.codeStatus.disabled'),
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

    const getReferralStatusLabel = (status: string) => referralStatusLabels[status] || status;
    const getCodeStatusLabel = (enabled: boolean) => (
      enabled ? codeStatusLabels.active : codeStatusLabels.disabled
    );

    return {
      referralStatusLabels,
      codeStatusLabels,
      fmtDate,
      getReferralStatusLabel,
      getCodeStatusLabel,
      referralStatusVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
