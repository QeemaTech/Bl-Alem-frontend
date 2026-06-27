import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  accountStatusVariant,
  approvalVariant,
  roleVariant,
} from '../utils/adminFormatters';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../utils/currency';
import { formatDate, formatNumber } from '../utils/localeFormat';

export function useAdminUserLabels() {
  const { t, i18n } = useTranslation('users');
  const lang = i18n.language;

  return useMemo(() => {
    const roleLabels: Record<string, string> = {
      STUDENT: t('labels.role.STUDENT'),
      INSTRUCTOR: t('labels.role.INSTRUCTOR'),
      SUPER_ADMIN: t('labels.role.SUPER_ADMIN'),
    };

    const accountStatusLabels: Record<string, string> = {
      ACTIVE: t('labels.accountStatus.ACTIVE'),
      PENDING: t('labels.accountStatus.PENDING'),
      SUSPENDED: t('labels.accountStatus.SUSPENDED'),
      REJECTED: t('labels.accountStatus.REJECTED'),
    };

    const approvalLabels: Record<string, string> = {
      PENDING: t('labels.approval.PENDING'),
      APPROVED: t('labels.approval.APPROVED'),
      REJECTED: t('labels.approval.REJECTED'),
      SUSPENDED: t('labels.approval.SUSPENDED'),
    };

    const fmtDate = (value?: string | null) => (
      value
        ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }, lang)
        : t('empty')
    );

    const fmtMoney = (value: number, currencyCode = DEFAULT_CURRENCY) => {
      const num = Math.round(Number(value || 0) * 100) / 100;
      return `${formatNumber(num, { minimumFractionDigits: 0, maximumFractionDigits: 2 }, lang)} ${getCurrencySymbol(currencyCode, lang)}`;
    };

    const formatInterests = (interests: unknown) => {
      if (!interests) return t('empty');
      if (Array.isArray(interests)) {
        return interests.join(lang === 'en' ? ', ' : '، ');
      }
      return String(interests);
    };

    const activityLabel = (user: { role?: string; _count?: { courses?: number; enrollments?: number } }) => {
      if (user.role === 'INSTRUCTOR') {
        return t('activity.courses', { count: user._count?.courses ?? 0 });
      }
      if (user.role === 'STUDENT') {
        return t('activity.enrollments', { count: user._count?.enrollments ?? 0 });
      }
      return t('empty');
    };

    const getRoleLabel = (role: string) => roleLabels[role] || role;
    const getStatusLabel = (status: string) => accountStatusLabels[status] || status;
    const getApprovalLabel = (status: string) => approvalLabels[status] || t('empty');

    return {
      roleLabels,
      accountStatusLabels,
      statusLabels: accountStatusLabels,
      approvalLabels,
      fmtDate,
      fmtMoney,
      formatInterests,
      activityLabel,
      getRoleLabel,
      getStatusLabel,
      getApprovalLabel,
      roleVariant,
      statusVariant: accountStatusVariant,
      approvalVariant,
      empty: t('empty'),
      lang,
    };
  }, [t, lang]);
}
