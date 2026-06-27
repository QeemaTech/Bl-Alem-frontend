import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CreditCard, Download, DollarSign, RefreshCw, TrendingUp } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useAdminPaymentLabels } from '../../hooks/useAdminPaymentLabels';
import { exportTableToExcel } from '../../utils/exportExcel';
import { fmtMoney } from '../../utils/adminFormatters';
import { formatDate, formatNumber } from '../../utils/localeFormat';

const monthKey = (value: string) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminPaymentsPage() {
  const { t, i18n } = useTranslation(['payments', 'common']);
  const {
    statusLabels,
    gatewayLabels,
    fmtPaymentDate,
    paymentStatusVariant,
    empty,
    lang,
  } = useAdminPaymentLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');

  const exportColumns = useMemo(() => {
    const cols = t('export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'student', header: cols.student },
      { key: 'email', header: cols.email },
      { key: 'course', header: cols.course },
      { key: 'amount', header: cols.amount },
      { key: 'discount', header: cols.discount },
      { key: 'finalAmount', header: cols.finalAmount },
      { key: 'gateway', header: cols.gateway },
      { key: 'transactionRef', header: cols.transactionRef },
      { key: 'status', header: cols.status },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t]);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.payments());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (gatewayFilter) result = result.filter((i) => i.gateway === gatewayFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [
          i.user?.fullName,
          i.user?.email,
          i.course?.titleAr,
          i.course?.titleEn,
          i.transactionRef,
          String(i.id),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, gatewayFilter, search]);

  const stats = useMemo(() => {
    const sum = (list: any[], field = 'finalAmount') =>
      list.reduce((acc, item) => acc + Number(item[field] || 0), 0);
    const paid = items.filter((i) => i.status === 'PAID');
    const pending = items.filter((i) => i.status === 'PENDING');
    const failed = items.filter((i) => i.status === 'FAILED');
    const refunded = items.filter((i) => i.status === 'REFUNDED');
    return {
      total: items.length,
      paidCount: paid.length,
      paidAmount: sum(paid),
      pendingCount: pending.length,
      pendingAmount: sum(pending),
      failedCount: failed.length,
      refundedCount: refunded.length,
      refundedAmount: sum(refunded),
      totalRevenue: sum(paid),
    };
  }, [items]);

  const monthlyChart = useMemo(() => {
    const map = new Map<string, number>();
    items
      .filter((i) => i.status === 'PAID')
      .forEach((i) => {
        const key = monthKey(i.createdAt);
        map.set(key, (map.get(key) || 0) + Number(i.finalAmount || 0));
      });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([key, value]) => {
        const [y, m] = key.split('-').map(Number);
        return {
          label: formatDate(new Date(y, m - 1, 1), { year: 'numeric', month: 'short' }, lang),
          value,
        };
      });
  }, [items, lang]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const key = i.status;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      label: statusLabels[key] || key,
      value,
    }));
  }, [items, statusLabels]);

  const gatewayOptions = useMemo(() => {
    const gateways = [...new Set(items.map((i) => i.gateway).filter(Boolean))];
    return [
      { label: t('filters.allGateways'), value: '' },
      ...gateways.map((g) => ({ label: gatewayLabels[g] || g, value: g })),
    ];
  }, [items, t, gatewayLabels]);

  const statusFilterOptions = useMemo(() => [
    { label: t('filters.allStatuses'), value: '' },
    { label: statusLabels.PAID, value: 'PAID' },
    { label: statusLabels.PENDING, value: 'PENDING' },
    { label: statusLabels.FAILED, value: 'FAILED' },
    { label: statusLabels.REFUNDED, value: 'REFUNDED' },
  ], [t, statusLabels]);

  const tableCols = t('table.columns', { returnObjects: true }) as Record<string, string>;

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    student: row.user?.fullName || empty,
    email: row.user?.email || empty,
    course: row.course?.titleAr || row.course?.titleEn || empty,
    amount: fmtMoney(Number(row.amount)),
    discount: Number(row.discountAmount) > 0 ? fmtMoney(Number(row.discountAmount)) : empty,
    finalAmount: fmtMoney(Number(row.finalAmount)),
    gateway: gatewayLabels[row.gateway] || row.gateway || empty,
    transactionRef: row.transactionRef || empty,
    status: statusLabels[row.status] || row.status,
    createdAt: fmtPaymentDate(row.createdAt),
    _raw: row,
  })), [filteredItems, statusLabels, gatewayLabels, fmtPaymentDate, empty]);

  const handleExport = () => {
    exportTableToExcel(
      t('export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title={t('title')} subtitle={t('subtitle')} />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title={t('stats.total')} value={String(stats.total)} icon={CreditCard} />
        <StatCard title={t('stats.paidCount')} value={String(stats.paidCount)} icon={DollarSign} />
        <StatCard title={t('stats.totalRevenue')} value={fmtMoney(stats.totalRevenue)} icon={TrendingUp} />
        <StatCard title={t('stats.pendingCount')} value={String(stats.pendingCount)} icon={RefreshCw} />
        <StatCard title={t('stats.failedCount')} value={String(stats.failedCount)} icon={CreditCard} />
        <StatCard title={t('stats.refundedCount')} value={String(stats.refundedCount)} icon={RefreshCw} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('charts.monthlyRevenue')} type="bar" data={monthlyChart} />
        <ReportChart title={t('charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setGatewayFilter(''); }}
      >
        <Select
          label={t('filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={statusFilterOptions}
        />
        <Select
          label={t('filters.gateway')}
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          options={gatewayOptions}
        />
      </FilterBar>

      <Card className="reports-table-card">
        <div className="section-heading reports-table-head">
          <h2>
            <span className="reports-table-title-icon" aria-hidden="true">
              <CreditCard size={20} />
            </span>
            {t('table.title')}
          </h2>
          <span className="muted-count">
            {t('common:table.recordCount', {
              count: formatNumber(filteredItems.length, undefined, i18n.language),
            })}
          </span>
        </div>
        <Table
          className="admin-users-table"
          loading={loading}
          data={tableRows}
          stickyHeader
          compact
          fluid
          maxHeight={560}
          emptyTitle={t('table.emptyTitle')}
          emptyDescription={t('table.emptyDescription')}
          columns={[
            { key: 'id', header: tableCols.id, width: '6.5rem', align: 'center' },
            { key: 'student', header: tableCols.student, minWidth: '9rem' },
            { key: 'course', header: tableCols.course, minWidth: '10rem', truncate: false },
            { key: 'finalAmount', header: tableCols.finalAmount, width: '7rem', align: 'center' },
            { key: 'gateway', header: tableCols.gateway, width: '7rem', align: 'center', hideOnMobile: true },
            {
              key: 'status',
              header: tableCols.status,
              width: '7.5rem',
              align: 'center',
              render: (row) => (
                <Badge variant={paymentStatusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'createdAt', header: tableCols.createdAt, width: '9rem', align: 'center', hideOnMobile: true },
            {
              key: 'actions',
              header: tableCols.actions,
              width: '8rem',
              minWidth: '8rem',
              truncate: false,
              render: (row) => (
                <div className="table-actions user-row-actions">
                  <Link to={`/admin/payments/${row._raw.id}`} className="btn btn-ghost btn-sm">
                    {t('actions.detail')}
                  </Link>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
