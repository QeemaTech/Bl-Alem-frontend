import { useEffect, useMemo, useState } from 'react';
import { CreditCard, Download, DollarSign, RefreshCw, TrendingUp } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  PAID: 'مدفوع',
  PENDING: 'قيد الانتظار',
  FAILED: 'فاشل',
  REFUNDED: 'مسترد',
};

const gatewayLabels: Record<string, string> = {
  SIMULATED: 'محاكاة',
  WALLET: 'المحفظة',
  STRIPE: 'Stripe',
  PAYPAL: 'PayPal',
};

const statusVariant = (status: string) => {
  if (status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'FAILED') return 'rejected' as const;
  if (status === 'REFUNDED') return 'warning' as const;
  return 'default' as const;
};

const fmtMoney = (value: number) => `${Number(value).toLocaleString('ar-SA')} ر.س`;

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  : '—');

const monthKey = (value: string) => {
  const d = new Date(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string) => {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short' });
};

const exportColumns = [
  { key: 'id', header: 'رقم العملية' },
  { key: 'student', header: 'الطالب' },
  { key: 'email', header: 'البريد' },
  { key: 'course', header: 'الكورس' },
  { key: 'amount', header: 'المبلغ الأصلي' },
  { key: 'discount', header: 'الخصم' },
  { key: 'finalAmount', header: 'المبلغ النهائي' },
  { key: 'gateway', header: 'بوابة الدفع' },
  { key: 'transactionRef', header: 'مرجع العملية' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'التاريخ' },
];

export default function AdminPaymentsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<any>(null);

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
      .map(([key, value]) => ({ label: monthLabel(key), value }));
  }, [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const gatewayOptions = useMemo(() => {
    const gateways = [...new Set(items.map((i) => i.gateway).filter(Boolean))];
    return [
      { label: 'كل البوابات', value: '' },
      ...gateways.map((g) => ({ label: gatewayLabels[g] || g, value: g })),
    ];
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    student: row.user?.fullName || '—',
    email: row.user?.email || '—',
    course: row.course?.titleAr || row.course?.titleEn || '—',
    amount: fmtMoney(Number(row.amount)),
    discount: Number(row.discountAmount) > 0 ? fmtMoney(Number(row.discountAmount)) : '—',
    finalAmount: fmtMoney(Number(row.finalAmount)),
    gateway: gatewayLabels[row.gateway] || row.gateway || '—',
    transactionRef: row.transactionRef || '—',
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openDetail = (payment: any) => {
    setSelected(payment);
    setDetailOpen(true);
  };

  const handleRefund = async () => {
    if (!refundTarget) return;
    try {
      await adminApi.refundPayment(refundTarget.id);
      showToast('تم استرداد المبلغ بنجاح.', 'success');
      setRefundTarget(null);
      setDetailOpen(false);
      setSelected(null);
      await load();
    } catch {
      showToast('تعذّر استرداد المبلغ.', 'error');
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'المدفوعات',
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="المدفوعات" subtitle="مراجعة عمليات الدفع والاستردادات" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي العمليات" value={String(stats.total)} icon={CreditCard} />
        <StatCard title="مدفوعات ناجحة" value={String(stats.paidCount)} icon={DollarSign} />
        <StatCard title="إجمالي الإيرادات" value={fmtMoney(stats.totalRevenue)} icon={TrendingUp} />
        <StatCard title="قيد الانتظار" value={String(stats.pendingCount)} icon={RefreshCw} />
        <StatCard title="فاشلة" value={String(stats.failedCount)} icon={CreditCard} />
        <StatCard title="مستردة" value={String(stats.refundedCount)} icon={RefreshCw} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="الإيرادات الشهرية (مدفوعات ناجحة)" type="bar" data={monthlyChart} />
        <ReportChart title="توزيع حالات الدفع" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالطالب، الكورس، أو مرجع العملية..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setGatewayFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'مدفوع', value: 'PAID' },
            { label: 'قيد الانتظار', value: 'PENDING' },
            { label: 'فاشل', value: 'FAILED' },
            { label: 'مسترد', value: 'REFUNDED' },
          ]}
        />
        <Select
          label="بوابة الدفع"
          value={gatewayFilter}
          onChange={(e) => setGatewayFilter(e.target.value)}
          options={gatewayOptions}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد مدفوعات"
          emptyDescription="ستظهر عمليات الدفع هنا عند إتمامها."
          columns={[
            { key: 'id', header: 'رقم العملية' },
            { key: 'student', header: 'الطالب' },
            { key: 'course', header: 'الكورس' },
            { key: 'finalAmount', header: 'المبلغ' },
            { key: 'gateway', header: 'البوابة' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'createdAt', header: 'التاريخ' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const payment = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(payment)}>
                      التفاصيل
                    </Button>
                    {payment.status === 'PAID' ? (
                      <Button variant="danger" size="sm" onClick={() => setRefundTarget(payment)}>
                        استرداد
                      </Button>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={detailOpen}
        title="تفاصيل عملية الدفع"
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {selected ? (
          <div className="stack-sm">
            <div className="detail-row"><span>رقم العملية</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>الطالب</span><strong>{selected.user?.fullName || '—'}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.user?.email || '—'}</strong></div>
            <div className="detail-row"><span>الكورس</span><strong>{selected.course?.titleAr || '—'}</strong></div>
            <div className="detail-row"><span>المبلغ الأصلي</span><strong>{fmtMoney(Number(selected.amount))}</strong></div>
            <div className="detail-row"><span>الخصم</span><strong>{fmtMoney(Number(selected.discountAmount))}</strong></div>
            <div className="detail-row"><span>المبلغ النهائي</span><strong>{fmtMoney(Number(selected.finalAmount))}</strong></div>
            <div className="detail-row"><span>بوابة الدفع</span><strong>{gatewayLabels[selected.gateway] || selected.gateway || '—'}</strong></div>
            <div className="detail-row"><span>مرجع العملية</span><strong dir="ltr">{selected.transactionRef || '—'}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            {selected.status === 'PAID' ? (
              <Button variant="danger" onClick={() => setRefundTarget(selected)}>
                استرداد المبلغ
              </Button>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(refundTarget)}
        title="استرداد المبلغ"
        message={`هل أنت متأكد من استرداد مبلغ ${fmtMoney(Number(refundTarget?.finalAmount || 0))} للطالب "${refundTarget?.user?.fullName}"؟`}
        confirmLabel="تأكيد الاسترداد"
        onConfirm={handleRefund}
        onCancel={() => setRefundTarget(null)}
      />
    </div>
  );
}
