import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import {
  type ReportTab,
  useAdminReportsLabels,
} from '../../hooks/useAdminReportsLabels';
import { exportReportToExcel } from '../../utils/exportExcel';

const tableTitleIcons: Record<ReportTab, MaterialIcon> = {
  revenue: Receipt,
  users: Users,
  courses: BookOpen,
  instructors: CoPresent,
  enrollments: Ticket,
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

interface ReportData {
  summary: Record<string, number>;
  charts: { id: string; title: string; type: 'bar' | 'line' | 'pie'; data: { label: string; value: number }[] }[];
  table: { title: string; columns: { key: string; header: string }[]; rows: Record<string, unknown>[] };
}

export default function AdminReportsPage() {
  const { t } = useTranslation('reports');
  const { t: tc } = useTranslation('common');
  const labels = useAdminReportsLabels();
  const [tab, setTab] = useState<ReportTab>('revenue');
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminApi.report(tab).then(setData).finally(() => setLoading(false));
  }, [tab]);

  const summaryEntries = useMemo(
    () => Object.entries(data?.summary || {}).filter(([key]) => !labels.hiddenSummaryKeys.has(key)),
    [data, labels.hiddenSummaryKeys],
  );

  const localizedTable = useMemo(() => {
    if (!data) return null;
    return {
      title: labels.getTableTitle(tab),
      columns: data.table.columns.map((col) => ({
        ...col,
        header: labels.getColumnHeader(tab, col.key),
      })),
      rows: data.table.rows,
    };
  }, [data, labels, tab]);

  const localizedCharts = useMemo(() => {
    if (!data) return [];
    return data.charts.map((chart) => ({
      ...chart,
      title: labels.getChartTitle(tab, chart.id),
      data: labels.translateChartData(tab, chart.id, chart.data),
    }));
  }, [data, labels, tab]);

  const handleExport = () => {
    if (!data || !localizedTable) return;
    exportReportToExcel(
      labels.tabTitles[tab],
      data.summary,
      labels.summaryLabels[tab],
      localizedTable,
      labels.exportLabels,
    );
  };

  const TableTitleIcon = tableTitleIcons[tab];

  return (
    <div className="page-grid admin-reports-page">
      <div className="reports-header">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={loading || !data}>
            {t('export.button')}
          </Button>
        </div>
      </div>

      <Tabs activeTab={tab} onChange={(next) => setTab(next as ReportTab)} tabs={labels.tabs} variant="pills" />

      {loading ? (
        <DashboardSkeleton />
      ) : data && localizedTable ? (
        <>
          <div className="stats-grid">
            {summaryEntries.map(([key, value]) => (
              <StatCard
                key={key}
                title={labels.getSummaryLabel(tab, key)}
                value={labels.fmtSummaryValue(key, value)}
                icon={summaryIcons[tab][key] || BarChart3}
              />
            ))}
          </div>

          {localizedCharts.length ? (
            <div className="reports-charts-grid">
              {localizedCharts.map((chart) => (
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
                {localizedTable.title}
              </h2>
              <span className="muted-count">
                {tc('table.recordCount', { count: localizedTable.rows.length })}
              </span>
            </div>
            <Table
              fluid
              hideScrollNotice
              columns={localizedTable.columns.map((col) => ({
                key: col.key,
                header: col.header,
                align: col.key === 'id' || col.key === 'amount' || col.key === 'discount' ? 'center' : 'start',
                render: (row) => labels.fmtTableCell(col.key, row[col.key]),
              }))}
              data={localizedTable.rows}
              emptyTitle={t('empty.title')}
              emptyDescription={t('empty.description')}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
}
