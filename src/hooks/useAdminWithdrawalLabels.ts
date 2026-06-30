import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { withdrawalStatusVariant, type WithdrawalStatus } from '../components/admin/withdrawals/types';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../utils/currency';
import { formatDateTime, formatNumber } from '../utils/localeFormat';

const STATUSES: WithdrawalStatus[] = ['PENDING', 'APPROVED', 'PAID', 'REJECTED'];

export function useAdminWithdrawalLabels() {
  const { t, i18n } = useTranslation('withdrawals');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels = Object.fromEntries(
      STATUSES.map((key) => [key, t(`admin.labels.status.${key}`)]),
    ) as Record<WithdrawalStatus, string>;

    const fmtWithdrawalDate = (value?: string | null) => (
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

    const fmtWithdrawalMoney = (value: number | string, currencyCode = DEFAULT_CURRENCY) => {
      const num = Math.round(Number(value || 0) * 100) / 100;
      return `${formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(currencyCode, lang)}`;
    };

    const getStatusLabel = (status: string) => (
      statusLabels[status as WithdrawalStatus] || status
    );

    const getTransferTypeLabel = (type: string) => (
      t(`admin.labels.transferTypes.${type}`, { defaultValue: type })
    );

    return {
      statusLabels,
      fmtWithdrawalDate,
      fmtWithdrawalMoney,
      getStatusLabel,
      getTransferTypeLabel,
      withdrawalStatusVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
