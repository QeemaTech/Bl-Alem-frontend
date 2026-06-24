import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, Receipt, TrendingUp, Wallet } from '@/icons';
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

const statusLabels: Record<string, string> = {
  PAID: 'مدفوع',
  PENDING: 'قيد الانتظار',
  FAILED: 'فاشل',
  REFUNDED: 'مسترد',
  COMPLETED: 'مكتمل',
};

const gatewayLabels: Record<string, string> = {
  SIMULATED: 'محاكاة',
  WALLET: 'المحفظة',
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
};

const statusVariant = (status: string) => {
  if (status === 'COMPLETED' || status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'FAILED') return 'rejected' as const;
  if (status === 'REFUNDED') return 'warning' as const;
  return 'default' as const;
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const exportColumns = [
  { key: 'course', header: 'الدورة' },
  { key: 'finalAmount', header: 'المبلغ' },
  { key: 'gateway', header: 'البوابة' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function StudentPaymentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

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
          i.course?.titleAr,
          i.transactionRef,
          gatewayLabels[i.gateway],
          statusLabels[i.status],
          String(i.finalAmount),
        ].some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, gatewayFilter, search]);

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
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const gatewayChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = gatewayLabels[i.gateway] || i.gateway;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const handleExport = () => {
    exportTableToExcel('المدفوعات', exportColumns, filtered.map((row) => ({
      course: row.course?.titleAr || '—',
      finalAmount: formatMoney(row.finalAmount),
      gateway: gatewayLabels[row.gateway] || row.gateway,
      status: statusLabels[row.status] || row.status,
      createdAt: fmtDate(row.createdAt),
    })));
    showToast('تم تصدير السجل.', 'success');
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="page-grid student-payments-page">
      <div className="reports-header">
        <PageHeader
          title="المدفوعات"
          subtitle="سجل عمليات الدفع والاشتراك في الدورات"
        />
        <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={!filtered.length}>
          تصدير Excel
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي العمليات" value={String(stats.total)} icon={Receipt} />
        <StatCard title="مدفوعة" value={String(stats.paid)} icon={CreditCard} />
        <StatCard title="إجمالي المدفوع" value={formatMoney(stats.spent)} icon={TrendingUp} />
        <StatCard title="خصومات مُوفَّرة" value={formatMoney(stats.saved)} icon={Wallet} hint={stats.refunded ? `${stats.refunded} مستردة` : undefined} />
      </div>

      {statusChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="توزيع حالات الدفع" type="pie" data={statusChart} />
          {gatewayChart.length ? (
            <ReportChart title="بوابات الدفع" type="pie" data={gatewayChart} />
          ) : null}
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالدورة أو المرجع..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setGatewayFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'مدفوع', value: 'PAID' },
            { label: 'قيد الانتظار', value: 'PENDING' },
            { label: 'مسترد', value: 'REFUNDED' },
            { label: 'فاشل', value: 'FAILED' },
          ]}
        />
        <Select
          label="البوابة"
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'المحفظة', value: 'WALLET' },
            { label: 'محاكاة', value: 'SIMULATED' },
            { label: 'Stripe', value: 'STRIPE' },
            { label: 'PayPal', value: 'PAYPAL' },
          ]}
        />
      </FilterBar>

      <Card>
        <div className="section-heading">
          <h2>سجل المدفوعات</h2>
          <span className="muted-count">{filtered.length} عملية</span>
        </div>
        <Table
          data={filtered}
          emptyTitle="لا توجد مدفوعات"
          emptyDescription="ستظهر عمليات الاشتراك بعد إتمام الدفع."
          columns={[
            {
              key: 'course',
              header: 'الدورة',
              render: (row) => String((row.course as any)?.titleAr || '—'),
            },
            {
              key: 'finalAmount',
              header: 'المبلغ',
              render: (row) => (
                <span className="amount-debit">{formatMoney(Number(row.finalAmount))}</span>
              ),
            },
            {
              key: 'gateway',
              header: 'البوابة',
              render: (row) => (
                <Badge variant="default">
                  {gatewayLabels[String(row.gateway)] || String(row.gateway)}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row.status))}>
                  {statusLabels[String(row.status)] || String(row.status)}
                </Badge>
              ),
            },
            {
              key: 'createdAt',
              header: 'التاريخ',
              render: (row) => fmtDate(String(row.createdAt)),
            },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => (
                <Button variant="ghost" size="sm" onClick={() => setSelected(row)}>
                  التفاصيل
                </Button>
              ),
            },
          ]}
        />
      </Card>

      <Modal isOpen={Boolean(selected)} title="تفاصيل الدفع" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>الدورة</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>المبلغ الأصلي</span><strong>{formatMoney(selected.amount)}</strong></div>
            <div className="detail-row"><span>الخصم</span><strong>{formatMoney(selected.discountAmount || 0)}</strong></div>
            <div className="detail-row"><span>المبلغ النهائي</span><strong>{formatMoney(selected.finalAmount)}</strong></div>
            <div className="detail-row">
              <span>البوابة</span>
              <Badge variant="default">{gatewayLabels[selected.gateway] || selected.gateway}</Badge>
            </div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            {selected.transactionRef ? (
              <div className="detail-row"><span>مرجع العملية</span><strong dir="ltr">{selected.transactionRef}</strong></div>
            ) : null}
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
