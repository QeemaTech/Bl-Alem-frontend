import { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp } from '@/icons';
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

const tabTitles: Record<ReportTab, string> = {
  revenue: 'تقرير الإيرادات',
  users: 'تقرير المستخدمين',
  courses: 'تقرير الكورسات',
  instructors: 'تقرير المحاضرين',
  enrollments: 'تقرير الاشتراكات',
};

const summaryLabels: Record<ReportTab, Record<string, string>> = {
  revenue: {
    totalRevenue: 'إجمالي الإيرادات (ر.س)',
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

const currencyKeys = new Set(['totalRevenue', 'monthRevenue', 'avgPayment', 'totalDiscount', 'refundedAmount', 'totalEarnings']);

interface ReportData {
  summary: Record<string, number>;
  charts: { id: string; title: string; type: 'bar' | 'line' | 'pie'; data: { label: string; value: number }[] }[];
  table: { title: string; columns: { key: string; header: string }[]; rows: Record<string, unknown>[] };
}

function formatSummaryValue(key: string, value: number) {
  if (currencyKeys.has(key)) return `${value.toLocaleString('ar-SA')} ر.س`;
  if (key === 'avgProgress' || key === 'completionRate') return `${value}%`;
  return value.toLocaleString('ar-SA');
}

export default function AdminReportsPage() {
  const [tab, setTab] = useState<ReportTab>('revenue');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.report(tab).then(setData).finally(() => setLoading(false));
  }, [tab]);

  const handleExport = () => {
    if (!data) return;
    exportReportToExcel(tabTitles[tab], data.summary, summaryLabels[tab], data.table);
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="التقارير" subtitle="إحصائيات وتحليلات أداء المنصة" />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={loading || !data}>
          تصدير Excel
        </Button>
      </div>

      <Tabs activeTab={tab} onChange={(next) => setTab(next as ReportTab)} tabs={[...tabs]} />

      {loading ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          <div className="stats-grid">
            {Object.entries(data.summary).map(([key, value]) => (
              <StatCard
                key={key}
                title={summaryLabels[tab][key] || key}
                value={formatSummaryValue(key, value)}
                icon={key.includes('Revenue') || key.includes('Payment') || key.includes('Earning') ? TrendingUp : BarChart3}
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

          <Card>
            <h2>{data.table.title}</h2>
            <Table
              columns={data.table.columns.map((col) => ({ key: col.key, header: col.header }))}
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
