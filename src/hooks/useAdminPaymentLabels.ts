import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { paymentStatusVariant } from '../components/admin/payments/paymentShared';
import { formatDateTime } from '../utils/localeFormat';

export function useAdminPaymentLabels() {
  const { t, i18n } = useTranslation('payments');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels: Record<string, string> = {
      PAID: t('labels.status.PAID'),
      PENDING: t('labels.status.PENDING'),
      FAILED: t('labels.status.FAILED'),
      REFUNDED: t('labels.status.REFUNDED'),
    };

    const gatewayLabels: Record<string, string> = {
      SIMULATED: t('labels.gateway.SIMULATED'),
      WALLET: t('labels.gateway.WALLET'),
      STRIPE: t('labels.gateway.STRIPE'),
      PAYPAL: t('labels.gateway.PAYPAL'),
    };

    const itemTypeLabels: Record<string, string> = {
      COURSE: t('labels.itemType.COURSE'),
      LEARNING_PATH: t('labels.itemType.LEARNING_PATH'),
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

    const getStatusLabel = (status: string) => statusLabels[status] || status;
    const getGatewayLabel = (gateway: string) => gatewayLabels[gateway] || gateway;
    const getItemTypeLabel = (type: string) => itemTypeLabels[type] || type;

    return {
      statusLabels,
      gatewayLabels,
      itemTypeLabels,
      paymentStatusLabels: statusLabels,
      paymentGatewayLabels: gatewayLabels,
      paymentItemTypeLabels: itemTypeLabels,
      fmtDate,
      fmtPaymentDate: fmtDate,
      getStatusLabel,
      getGatewayLabel,
      getItemTypeLabel,
      paymentStatusVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
