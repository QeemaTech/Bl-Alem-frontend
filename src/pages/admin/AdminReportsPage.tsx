import { useEffect, useMemo, useState } from 'react';
import type { MaterialIcon } from '@/icons';
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  CoPresent,
  CreditCard,
  Download,
  DollarSign,
  GraduationCap,
  Percent,
  Receipt,
  Shield,
  Table2,
  Ticket,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  XCircle,
} from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Tabs } from '../../components/ui/Tabs';
import { exportReportToExcel } from '../../utils/exportExcel';

const tabs = [
  { id: 'revenue', label: 'الإيرادات' },
  { id: 'users', label: 'المستخدمين' },
  { id: 'courses', label: 'الكورسات' },
  { id: 'instructors', label: 'المحاضرين' },
  { id: 'enrollments', label: 'الاشتراكات' },
] as const;

type ReportTab = (typeof tabs)[number]['id'];

const HIDDEN_SUMMARY_KEYS = new Set(['refundedCount', 'refundedAmount']);

const tabTitles: Record<ReportTab, string> = {
  revenue: 'تقرير الإيرادات',
  users: 'تقرير المستخدمين',
  courses: 'تقرير الكورسات',
  instructors: 'تقرير المحاضرين',
  enrollments: 'تقرير الاشتراكات',
};

const tableTitleIcons: Record<ReportTab, MaterialIcon> = {
  revenue: Receipt,
  users: Users,
  courses: BookOpen,
  instructors: CoPresent,
  enrollments: Ticket,
};

const summaryLabels: Record<ReportTab, Record<string, string>> = {
  revenue: {
    totalRevenue: 'إجمالي الإيرادات (ج.م)',
    paymentsCount: 'عدد المدفوعات',
    monthRevenue: 'إيرادات الشهر الحالي',
    monthPayments: 'مدفوعات الشهر الحالي',
    avgPayment: 'متوسط قيمة الدفع',
    totalDiscount: 'إجمالي الخصومات',
    refundedCount: 'عمليات مستردة',
    refundedAmount: 'مبلغ المستردات',
  },
  users: {
    total: 'إجمالي المستخدمين',
    students: 'الطلاب',
    instructors: 'المحاضرين',
    admins: 'المشرفين',
    active: 'حسابات نشطة',
    suspended: 'حسابات موقوفة',
    newThisMonth: 'جدد هذا الشهر',
  },
  courses: {
    total: 'إجمالي الكورسات',
    published: 'منشورة',
    pending: 'قيد المراجعة',
    draft: 'مسودات',
    rejected: 'مرفوضة',
    suspended: 'موقوفة',
  },
  instructors: {
    total: 'إجمالي المحاضرين',
    pending: 'قيد المراجعة',
    approved: 'معتمدين',
    rejected: 'مرفوضين',
    suspended: 'موقوفين',
  },
  enrollments: {
    total: 'إجمالي الاشتراكات',
    active: 'نشطة',
    completed: 'مكتملة',
    cancelled: 'ملغاة',
    avgProgress: 'متوسط الإنجاز %',
    completionRate: 'نسبة الإكمال %',
  },
};

const summaryIcons: Record<ReportTab, Record<string, MaterialIcon>> = {
  revenue: {
    totalRevenue: DollarSign,
    paymentsCount: Receipt,
    monthRevenue: TrendingUp,
    monthPayments: CreditCard,
    avgPayment: Wallet,
    totalDiscount: Percent,
  },
  users: {
    total: Users,
    students: GraduationCap,
    instructors: CoPresent,
    admins: Shield,
    active: UserCheck,
    suspended: XCircle,
    newThisMonth: TrendingUp,
  },
  courses: {
    total: BookOpen,
    published: CheckCircle2,
    pending: BarChart3,
    draft: BookOpen,
    rejected: XCircle,
    suspended: Shield,
  },
  instructors: {
    total: CoPresent,
    pending: BarChart3,
    approved: UserCheck,
    rejected: XCircle,
    suspended: Shield,
  },
  enrollments: {
    total: Ticket,
    active: CheckCircle2,
    completed: GraduationCap,
    cancelled: XCircle,
    avgProgress: BarChart3,
    completionRate: TrendingUp,
  },
};

const currencyKeys = new Set(['totalRevenue', 'monthRevenue', 'avgPayment', 'totalDiscount', 'totalEarnings']);

interface ReportData {
  summary: Record<string, number>;
  charts: { id: string; title: string; type: 'bar' | 'line' | 'pie'; data: { label: string; value: number }[] }[];
  table: { title: string; columns: { key: string; header: string }[]; rows: Record<string, unknown>[] };
}

function formatSummaryValue(key: string, value: number) {
  if (currencyKeys.has(key)) return `${value.toLocaleString('ar-EG')} ج.م`;
  if (key === 'avgProgress' || key === 'completionRate') return `${value}%`;
  return value.toLocaleString('ar-EG');
}

function formatTableCell(key: string, value: unknown) {
  if (value == null || value === '') return '—';
  if (key === 'amount' || key === 'discount') {
    return `${Number(value).toLocaleString('ar-EG')} ج.م`;
  }
  return String(value);
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>('revenue');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.report(tab).then(setData).finally(() => setLoading(false));
  }, [tab]);

  const summaryEntries = useMemo(
    () => Object.entries(data?.summary || {}).filter(([key]) => !HIDDEN_SUMMARY_KEYS.has(key)),
    [data],
  );

  const handleExport = () => {
    if (!data) return;
    exportReportToExcel(tabTitles[tab], data.summary, summaryLabels[tab], data.table);
  };

  const TableTitleIcon = tableTitleIcons[tab];

  return (
    <div className="page-grid admin-reports-page">
      <div className="reports-header">
        <PageHeader title="التقارير" subtitle="إحصائيات وتحليلات أداء المنصة" />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={loading || !data}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <Tabs activeTab={tab} onChange={(next) => setTab(next as ReportTab)} tabs={[...tabs]} variant="pills" />

      {loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <div className="stats-grid">
            {summaryEntries.map(([key, value]) => (
              <StatCard
                key={key}
                title={summaryLabels[tab][key] || key}
                value={formatSummaryValue(key, value)}
                icon={summaryIcons[tab][key] || BarChart3}
              />
            ))}
          </div>

          {data.charts.length ? (
            <div className="reports-charts-grid">
              {data.charts.map((chart) => (
                <ReportChart key={chart.id} title={chart.title} type={chart.type} data={chart.data} />
              ))}
            </div>
          ) : null}

          <Card className="reports-table-card">
            <div className="section-heading reports-table-head">
              <h2>
                <span className="reports-table-title-icon" aria-hidden="true">
                  <TableTitleIcon size={20} />
                </span>
                {data.table.title}
              </h2>
              <span className="muted-count">
                {data.table.rows.length.toLocaleString('ar-EG')} سجل
              </span>
            </div>
            <Table
              fluid
              hideScrollNotice
              columns={data.table.columns.map((col) => ({
                key: col.key,
                header: col.header,
                align: col.key === 'id' || col.key === 'amount' || col.key === 'discount' ? 'center' : 'start',
                render: (row) => formatTableCell(col.key, row[col.key]),
              }))}
              data={data.table.rows}
              emptyTitle="لا توجد بيانات"
              emptyDescription="لم يتم العثور على سجلات لهذا التقرير."
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
