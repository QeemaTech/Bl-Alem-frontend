import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DEFAULT_CURRENCY, getCurrencySymbol } from '../utils/currency';
import { formatDate, formatNumber } from '../utils/localeFormat';

export const REPORT_TABS = [
  'revenue',
  'users',
  'courses',
  'instructors',
  'enrollments',
] as const;

export type ReportTab = (typeof REPORT_TABS)[number];

const HIDDEN_SUMMARY_KEYS = new Set(['refundedCount', 'refundedAmount']);
const CURRENCY_KEYS = new Set(['totalRevenue', 'monthRevenue', 'avgPayment', 'totalDiscount', 'totalEarnings']);

const CHART_LABEL_KEYS: Record<string, string> = {
  طلاب: 'students',
  محاضرين: 'instructors',
  مشرفين: 'admins',
  نشط: 'active',
  موقوف: 'suspended',
  آخرون: 'others',
  منشور: 'published',
  'قيد المراجعة': 'pendingReview',
  مسودة: 'draft',
  مرفوض: 'rejected',
  معتمد: 'approved',
  مكتمل: 'completed',
  ملغي: 'cancelled',
  'غير محدد': 'unspecified',
  Students: 'students',
  Instructors: 'instructors',
  Admins: 'admins',
  Active: 'active',
  Suspended: 'suspended',
  Others: 'others',
  Published: 'published',
  'Pending review': 'pendingReview',
  Draft: 'draft',
  Rejected: 'rejected',
  Approved: 'approved',
  Completed: 'completed',
  Cancelled: 'cancelled',
  Unspecified: 'unspecified',
};

const STATUS_VALUE_KEYS: Record<string, string> = {
  طالب: 'STUDENT',
  محاضر: 'INSTRUCTOR',
  مشرف: 'SUPER_ADMIN',
  نشط: 'ACTIVE',
  موقوف: 'SUSPENDED',
  مسودة: 'DRAFT',
  'قيد المراجعة': 'PENDING_REVIEW',
  معتمد: 'APPROVED',
  منشور: 'PUBLISHED',
  مرفوض: 'REJECTED',
  مكتمل: 'COMPLETED',
  ملغي: 'CANCELLED',
  مدفوع: 'PAID',
  'قيد الانتظار': 'PENDING',
  فشل: 'FAILED',
  مسترد: 'REFUNDED',
};

export function useAdminReportsLabels() {
  const { t, i18n } = useTranslation('reports');
  const { t: tu } = useTranslation('users');
  const lang = i18n.language;

  return useMemo(() => {
    const tabs = REPORT_TABS.map((id) => ({
      id,
      label: t(`tabs.${id}`),
    }));

    const tabTitles = Object.fromEntries(
      REPORT_TABS.map((id) => [id, t(`tabTitles.${id}`)]),
    ) as Record<ReportTab, string>;

    const summaryLabels = Object.fromEntries(
      REPORT_TABS.map((tab) => [
        tab,
        Object.fromEntries(
          Object.keys(t(`summary.${tab}`, { returnObjects: true }) as Record<string, string>)
            .map((key) => [key, t(`summary.${tab}.${key}`)]),
        ),
      ]),
    ) as Record<ReportTab, Record<string, string>>;

    const getSummaryLabel = (tab: ReportTab, key: string) =>
      summaryLabels[tab]?.[key] || key;

    const getTableTitle = (tab: ReportTab) => t(`table.${tab}.title`);

    const getColumnHeader = (tab: ReportTab, key: string) =>
      t(`table.${tab}.columns.${key}`, { defaultValue: key });

    const getChartTitle = (tab: ReportTab, chartId: string) =>
      t(`charts.${tab}.${chartId}`, { defaultValue: chartId });

    const translateChartLabel = (label: string) => {
      const key = CHART_LABEL_KEYS[label];
      return key ? t(`dataLabels.${key}`) : label;
    };

    const getMonthLabels = (count = 6) => {
      const labels: string[] = [];
      const now = new Date();
      for (let i = count - 1; i >= 0; i -= 1) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        labels.push(formatDate(d, { month: 'short', year: 'numeric' }, lang));
      }
      return labels;
    };

    const translateChartData = (
      tab: ReportTab,
      chartId: string,
      data: { label: string; value: number }[],
    ) => {
      const monthLabels = getMonthLabels(6);
      return data.map((item, index) => {
        if (chartId === 'monthly' || chartId === 'registrations') {
          return { ...item, label: monthLabels[index] ?? translateChartLabel(item.label) };
        }
        return { ...item, label: translateChartLabel(item.label) };
      });
    };

    const translateCellValue = (key: string, value: unknown) => {
      if (value == null || value === '') return '—';
      const str = String(value);

      if (key === 'role' && STATUS_VALUE_KEYS[str]) {
        return tu(`labels.role.${STATUS_VALUE_KEYS[str]}`);
      }
      if ((key === 'status' || key === 'approvalStatus') && STATUS_VALUE_KEYS[str]) {
        const statusKey = STATUS_VALUE_KEYS[str];
        if (key === 'approvalStatus') {
          return tu(`labels.approval.${statusKey}`, { defaultValue: str });
        }
        return tu(`labels.accountStatus.${statusKey}`, { defaultValue: str });
      }

      return str;
    };

    const fmtSummaryValue = (key: string, value: number) => {
      if (CURRENCY_KEYS.has(key)) {
        return `${formatNumber(value, undefined, lang)} ${getCurrencySymbol(DEFAULT_CURRENCY, lang)}`;
      }
      if (key === 'avgProgress' || key === 'completionRate') return `${value}%`;
      return formatNumber(value, undefined, lang);
    };

    const fmtTableCell = (key: string, value: unknown) => {
      if (value == null || value === '') return '—';
      if (key === 'amount' || key === 'discount' || key === 'price' || key === 'totalEarnings') {
        return `${formatNumber(Number(value), undefined, lang)} ${getCurrencySymbol(DEFAULT_CURRENCY, lang)}`;
      }
      if (key === 'progress') return `${value}%`;
      return translateCellValue(key, value);
    };

    return {
      lang,
      tabs,
      tabTitles,
      summaryLabels,
      hiddenSummaryKeys: HIDDEN_SUMMARY_KEYS,
      currencyKeys: CURRENCY_KEYS,
      getSummaryLabel,
      getTableTitle,
      getColumnHeader,
      getChartTitle,
      translateChartData,
      fmtSummaryValue,
      fmtTableCell,
      exportLabels: {
        summarySheet: t('export.summarySheet'),
        detailsSheet: t('export.detailsSheet'),
        summaryItem: t('export.summaryItem'),
        summaryValue: t('export.summaryValue'),
      },
    };
  }, [t, tu, lang]);
}
