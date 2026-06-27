import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../utils/currency';
import { formatDate, formatNumber } from '../utils/localeFormat';

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  if (status === 'EXPIRED') return 'rejected' as const;
  return 'default' as const;
};

export function useAdminCouponLabels() {
  const { t, i18n } = useTranslation('coupons');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels: Record<string, string> = {
      ACTIVE: t('labels.status.ACTIVE'),
      INACTIVE: t('labels.status.INACTIVE'),
      EXPIRED: t('labels.status.EXPIRED'),
    };

    const typeLabels: Record<string, string> = {
      PERCENTAGE: t('labels.type.PERCENTAGE'),
      FIXED: t('labels.type.FIXED'),
    };

    const fmtDate = (value?: string | null) => (
      value
        ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }, lang)
        : t('empty')
    );

    const formatValue = (type: string, value: number) => (
      type === 'PERCENTAGE'
        ? `${value}%`
        : `${formatNumber(value, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(DEFAULT_CURRENCY, lang)}`
    );

    const formatMoney = (value: number | null | undefined) => (
      value != null
        ? `${formatNumber(Number(value), { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(DEFAULT_CURRENCY, lang)}`
        : t('empty')
    );

    const courseLabel = (coupon: { appliesToAll?: boolean; courses?: { course?: { titleAr?: string } }[] }) => {
      if (coupon.appliesToAll) return t('labels.courses.all');
      const names = (coupon.courses || [])
        .map((row) => row.course?.titleAr)
        .filter(Boolean);
      return names.length ? names.join(lang === 'en' ? ', ' : '، ') : t('labels.courses.specific');
    };

    const listSeparator = lang === 'en' ? ', ' : '، ';

    return {
      statusLabels,
      typeLabels,
      fmtDate,
      formatValue,
      formatMoney,
      courseLabel,
      statusVariant,
      empty: t('empty'),
      unlimited: t('labels.unlimited'),
      listSeparator,
      lang,
    };
  }, [t, lang]);
}
