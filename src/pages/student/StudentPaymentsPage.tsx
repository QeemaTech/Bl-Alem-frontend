import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Download, Receipt, Table2, TrendingUp, Wallet } from '@/icons';
import { studentApi } from '../../api/student';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';
import { formatMoney, roundMoney } from '../../utils/formatMoney';
import { localizedCourseTitle } from '../../utils/localizedContent';
import { formatDateTime, formatNumber } from '../../utils/localeFormat';

const statusVariant = (status: string) => {
  if (status === 'COMPLETED' || status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'FAILED') return 'rejected' as const;
  if (status === 'REFUNDED') return 'warning' as const;
  return 'default' as const;
};

export default function StudentPaymentsPage() {
  const { t, i18n } = useTranslation('payments');
  const lang = i18n.language;
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const fmtDate = (value: string) => formatDateTime(value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }, lang);

  const courseTitle = useCallback(
    (course: any) => localizedCourseTitle(course, lang),
    [lang],
  );

  const statusLabel = useCallback(
    (status: string) => t(`student.labels.status.${status}`, { defaultValue: status }),
    [t, lang],
  );

  const gatewayLabel = useCallback(
    (gateway: string) => t(`student.labels.gateway.${gateway}`, { defaultValue: gateway }),
    [t, lang],
  );

  const exportColumns = useMemo(() => [
    { key: 'course', header: t('student.export.columns.course') },
    { key: 'finalAmount', header: t('student.export.columns.finalAmount') },
    { key: 'gateway', header: t('student.export.columns.gateway') },
    { key: 'status', header: t('student.export.columns.status') },
    { key: 'createdAt', header: t('student.export.columns.createdAt') },
  ], [t, lang]);

  useEffect(() => {
    studentApi.payments().then(setItems).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (gatewayFilter) result = result.filter((i) => i.gateway === gatewayFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          courseTitle(i.course),
          i.transactionRef,
          gatewayLabel(i.gateway),
          statusLabel(i.status),
          String(i.finalAmount),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, gatewayFilter, search, lang, courseTitle, gatewayLabel, statusLabel]);

  const stats = useMemo(() => {
    const paid = items.filter((i) => i.status === 'PAID');
    const sum = (list: any[]) => list.reduce((acc, i) => acc + Number(i.finalAmount || 0), 0);
    return {
      total: items.length,
      paid: paid.length,
      refunded: items.filter((i) => i.status === 'REFUNDED').length,
      spent: roundMoney(sum(paid)),
      saved: roundMoney(items.reduce((acc, i) => acc + Number(i.discountAmount || 0), 0)),
    };
  }, [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabel(i.status);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items, lang, statusLabel]);

  const gatewayChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = gatewayLabel(i.gateway);
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items, lang, gatewayLabel]);

  const hasActiveFilters = Boolean(search.trim() || statusFilter || gatewayFilter);

  const handleExport = () => {
    exportTableToExcel(t('student.export.sheetName'), exportColumns, filtered.map((row) => ({
      course: courseTitle(row.course) || t('empty'),
      finalAmount: formatMoney(row.finalAmount, undefined, lang),
      gateway: gatewayLabel(row.gateway),
      status: statusLabel(row.status),
      createdAt: fmtDate(row.createdAt),
    })));
    showToast(t('student.toast.exported'), 'success');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-payments-page">
      <div className="reports-header">
        <PageHeader
          title={t('student.title')}
          subtitle={t('student.subtitle')}
        />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!filtered.length}>
            {t('student.actions.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('student.stats.total')} value={String(stats.total)} icon={Receipt} />
        <StatCard title={t('student.stats.paid')} value={String(stats.paid)} icon={CreditCard} />
        <StatCard title={t('student.stats.totalSpent')} value={formatMoney(stats.spent, undefined, lang)} icon={TrendingUp} />
        <StatCard
          title={t('student.stats.discountsSaved')}
          value={formatMoney(stats.saved, undefined, lang)}
          icon={Wallet}
          hint={stats.refunded ? t('student.stats.refundedHint', { count: stats.refunded }) : undefined}
        />
      </div>

      {statusChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title={t('student.charts.statusDistribution')} type="pie" data={statusChart} />
          {gatewayChart.length ? (
            <ReportChart title={t('student.charts.gateways')} type="pie" data={gatewayChart} />
          ) : null}
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('student.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setGatewayFilter(''); }}
        resetDisabled={!hasActiveFilters}
        ariaLabel={t('student.filters.ariaLabel')}
      >
        <Select
          label={t('student.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('student.filters.all'), value: '' },
            { label: statusLabel('PAID'), value: 'PAID' },
            { label: statusLabel('PENDING'), value: 'PENDING' },
            { label: statusLabel('REFUNDED'), value: 'REFUNDED' },
            { label: statusLabel('FAILED'), value: 'FAILED' },
          ]}
        />
        <Select
          label={t('student.filters.gateway')}
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          options={[
            { label: t('student.filters.all'), value: '' },
            { label: gatewayLabel('WALLET'), value: 'WALLET' },
            { label: gatewayLabel('SIMULATED'), value: 'SIMULATED' },
            { label: gatewayLabel('STRIPE'), value: 'STRIPE' },
            { label: gatewayLabel('PAYPAL'), value: 'PAYPAL' },
          ]}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <Table2 size={20} />
            </span>
            {t('student.table.title')}
          </h2>
          <span className="muted-count">{t('student.table.count', { count: formatNumber(filtered.length, undefined, lang) })}</span>
        </div>
        <Table
          fluid
          hideScrollNotice
          data={filtered}
          emptyTitle={t('student.table.emptyTitle')}
          emptyDescription={t('student.table.emptyDescription')}
          columns={[
            {
              key: 'course',
              header: t('student.table.columns.course'),
              render: (row) => courseTitle((row.course as any)) || t('empty'),
            },
            {
              key: 'finalAmount',
              header: t('student.table.columns.finalAmount'),
              render: (row) => (
                <span className="amount-debit">{formatMoney(Number(row.finalAmount), undefined, lang)}</span>
              ),
            },
            {
              key: 'gateway',
              header: t('student.table.columns.gateway'),
              render: (row) => (
                <Badge variant="default">
                  {gatewayLabel(String(row.gateway))}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: t('student.table.columns.status'),
              render: (row) => (
                <Badge variant={statusVariant(String(row.status))}>
                  {statusLabel(String(row.status))}
                </Badge>
              ),
            },
            {
              key: 'createdAt',
              header: t('student.table.columns.createdAt'),
              render: (row) => fmtDate(String(row.createdAt)),
            },
            {
              key: 'actions',
              header: t('student.table.columns.actions'),
              render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                  {t('student.actions.details')}
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title={t('student.modal.detailTitle')} onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>{t('student.modal.fields.course')}</span><strong>{courseTitle(selected.course) || t('empty')}</strong></div>
            <div className="detail-row"><span>{t('student.modal.fields.amount')}</span><strong>{formatMoney(selected.amount, undefined, lang)}</strong></div>
            <div className="detail-row"><span>{t('student.modal.fields.discount')}</span><strong>{formatMoney(selected.discountAmount || 0, undefined, lang)}</strong></div>
            <div className="detail-row"><span>{t('student.modal.fields.finalAmount')}</span><strong>{formatMoney(selected.finalAmount, undefined, lang)}</strong></div>
            <div className="detail-row">
              <span>{t('student.modal.fields.gateway')}</span>
              <Badge variant="default">{gatewayLabel(selected.gateway)}</Badge>
            </div>
            <div className="detail-row">
              <span>{t('student.modal.fields.status')}</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabel(selected.status)}
              </Badge>
            </div>
            {selected.transactionRef ? (
              <div className="detail-row"><span>{t('student.modal.fields.transactionRef')}</span><strong dir="ltr">{selected.transactionRef}</strong></div>
            ) : null}
            <div className="detail-row"><span>{t('student.modal.fields.createdAt')}</span><strong>{fmtDate(selected.createdAt)}</strong></div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
