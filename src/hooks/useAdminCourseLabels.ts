import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { statusVariant } from '../components/admin/courses/courseShared';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../utils/currency';
import { formatDate, formatNumber } from '../utils/localeFormat';

export function useAdminCourseLabels() {
  const { t, i18n } = useTranslation('courses');
  const lang = i18n.language;

  return useMemo(() => {
    const statusLabels: Record<string, string> = {
      DRAFT: t('admin.labels.status.DRAFT'),
      PENDING_REVIEW: t('admin.labels.status.PENDING_REVIEW'),
      APPROVED: t('admin.labels.status.APPROVED'),
      PUBLISHED: t('admin.labels.status.PUBLISHED'),
      REJECTED: t('admin.labels.status.REJECTED'),
      SUSPENDED: t('admin.labels.status.SUSPENDED'),
    };

    const levelLabels: Record<string, string> = {
      BEGINNER: t('form.levels.BEGINNER'),
      INTERMEDIATE: t('form.levels.INTERMEDIATE'),
      ADVANCED: t('form.levels.ADVANCED'),
    };

    const typeLabels: Record<string, string> = {
      RECORDED: t('form.types.RECORDED'),
      LIVE: t('form.types.LIVE'),
      MIXED: t('form.types.MIXED'),
    };

    const fmtDate = (value?: string | null, withTime = false) => (
      value
        ? formatDate(value, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
        }, lang)
        : t('admin.empty')
    );

    const fmtMoney = (course: { discountPrice?: number | null; price?: number | null; currency?: string }) => {
      const price = Number(course?.discountPrice ?? course?.price ?? 0);
      if (!price) return t('admin.free');
      const currencyCode = course?.currency || DEFAULT_CURRENCY;
      const num = Math.round(price * 100) / 100;
      return `${formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(currencyCode, lang)}`;
    };

    const fmtDuration = (seconds: number) => {
      const mins = Math.round(Number(seconds || 0) / 60);
      return mins ? t('admin.durationMinutes', { count: mins }) : t('admin.empty');
    };

    const getStatusLabel = (status: string) => statusLabels[status] || status;
    const getLevelLabel = (level: string) => levelLabels[level] || level;
    const getTypeLabel = (type: string) => typeLabels[type] || type;

    return {
      statusLabels,
      levelLabels,
      typeLabels,
      fmtDate,
      fmtMoney,
      fmtDuration,
      getStatusLabel,
      getLevelLabel,
      getTypeLabel,
      statusVariant,
      empty: t('admin.empty'),
      lang,
    };
  }, [t, lang]);
}
