import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownToLine, Banknote, Clock, Download, TrendingUp, Wallet,
} from 'lucide-react';
import { instructorApi } from '../../api/instructor';
import { ReportChart } from '../../components/reports/ReportChart';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { formatMoney, roundMoney } from '../../utils/formatMoney';
import { exportTableToExcel } from '../../utils/exportExcel';

const withdrawalVariant = (status: string) => {
  if (status === 'APPROVED' || status === 'PAID') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
  return 'default' as const;
};

const withdrawalLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PAID: 'مدفوع',
  REJECTED: 'مرفوض',
};

const fmtDate = (value: string) => new Date(value).toLocaleDateString('ar-SA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const emptyWithdrawForm = {
  amount: '',
  bankName: '',
  accountName: '',
  iban: '',
  notes: '',
};

const exportColumns = [
  { key: 'amount', header: 'المبلغ (ر.س)' },
  { key: 'status', header: 'الحالة' },
  { key: 'bankName', header: 'البنك' },
  { key: 'accountName', header: 'اسم الحساب' },
  { key: 'iban', header: 'IBAN' },
  { key: 'createdAt', header: 'التاريخ' },
  { key: 'notes', header: 'ملاحظات' },
];

export default function InstructorEarningsPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyWithdrawForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setData(await instructorApi.earnings());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const commission = Number(data?.platformCommission || 0.2);

  const salesChart = useMemo(() => {
    if (!data?.salesByCourse) return [];
    return data.salesByCourse
      .map((course: any) => ({
        label: course.titleAr,
        value: roundMoney(
          (course.payments || []).reduce((sum: number, p: any) => sum + Number(p.finalAmount || 0), 0)
            * (1 - commission),
        ),
      }))
      .filter((item: { value: number }) => item.value > 0)
      .sort((a: { value: number }, b: { value: number }) => b.value - a.value)
      .slice(0, 6);
  }, [data, commission]);

  const withdrawals = data?.withdrawals || [];

  const filteredWithdrawals = useMemo(() => {
    let result = withdrawals;
    if (statusFilter) result = result.filter((i: any) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i: any) =>
        [i.bankName, i.accountName, i.iban, String(i.amount), withdrawalLabels[i.status]]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [withdrawals, statusFilter, search]);

  const stats = useMemo(() => {
    const pending = withdrawals.filter((i: any) => i.status === 'PENDING');
    const paid = withdrawals.filter((i: any) => i.status === 'PAID');
    return {
      pendingCount: pending.length,
      paidCount: paid.length,
      salesCount: data?.recentTransactions?.length || 0,
    };
  }, [withdrawals, data]);

  const openWithdrawModal = () => {
    setForm({
      ...emptyWithdrawForm,
      amount: data?.availableBalance ? String(roundMoney(data.availableBalance)) : '',
    });
    setOpen(true);
  };

  const withdraw = async (e: FormEvent) => {
    e.preventDefault();
    const amount = roundMoney(form.amount);
    const available = roundMoney(data?.availableBalance || 0);
    if (amount <= 0) {
      showToast('أدخل مبلغاً صالحاً.', 'error');
      return;
    }
    if (amount > available) {
      showToast('المبلغ أكبر من الرصيد المتاح.', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await instructorApi.requestWithdrawal(form);
      setOpen(false);
      setForm(emptyWithdrawForm);
      showToast('تم إرسال طلب السحب بنجاح.', 'success');
      await load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message
        || 'تعذّر إرسال طلب السحب.';
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel('سحوبات-المحاضر', exportColumns, filteredWithdrawals.map((row: any) => ({
      amount: formatMoney(row.amount),
      status: withdrawalLabels[row.status] || row.status,
      bankName: row.bankName || '—',
      accountName: row.accountName || '—',
      iban: row.iban || '—',
      createdAt: fmtDate(row.createdAt),
      notes: row.notes || '—',
    })));
  };

  if (loading) return <DashboardSkeleton />;

  const available = roundMoney(data?.availableBalance || 0);
  const hasPending = withdrawals.some((i: any) => i.status === 'PENDING');

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="الأرباح"
          subtitle="تابع إيراداتك، مبيعاتك، وطلبات سحب الرصيد"
        />
        <div className="reports-actions">
          <Button
            icon={<ArrowDownToLine size={18} />}
            onClick={openWithdrawModal}
            disabled={available <= 0 || hasPending}
          >
            طلب سحب
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="إجمالي الأرباح"
          value={formatMoney(data?.totalEarnings)}
          icon={TrendingUp}
          hint="بعد خصم عمولة المنصة"
        />
        <StatCard
          title="الرصيد المتاح"
          value={formatMoney(data?.availableBalance)}
          icon={Wallet}
          hint={available > 0 ? 'جاهز للسحب' : 'لا يوجد رصيد'}
        />
        <StatCard
          title="الرصيد المعلق"
          value={formatMoney(data?.pendingBalance)}
          icon={Clock}
          hint={stats.pendingCount ? `${stats.pendingCount} طلب قيد المراجعة` : 'لا طلبات معلقة'}
        />
        <StatCard
          title="عمولة المنصة"
          value={`${roundMoney(commission * 100)}%`}
          icon={Banknote}
        />
      </div>

      {salesChart.length ? (
        <div className="reports-charts-grid">
          <ReportChart title="أرباح الكورسات (صافي)" type="bar" data={salesChart} />
        </div>
      ) : null}

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث في السحوبات..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="حالة السحب"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'الكل', value: '' },
            { label: 'قيد المراجعة', value: 'PENDING' },
            { label: 'معتمد', value: 'APPROVED' },
            { label: 'مدفوع', value: 'PAID' },
            { label: 'مرفوض', value: 'REJECTED' },
          ]}
        />
        <Button variant="outline" icon={<Download size={16} />} onClick={handleExport} disabled={!filteredWithdrawals.length}>
          تصدير Excel
        </Button>
      </FilterBar>

      <Card>
        <div className="section-heading">
          <h2>السحوبات</h2>
          <span className="muted-count">{filteredWithdrawals.length} طلب</span>
        </div>
        <Table
          data={filteredWithdrawals}
          emptyTitle="لا توجد سحوبات"
          emptyDescription="اطلب سحب الرصيد المتاح عند الحاجة."
          columns={[
            {
              key: 'amount',
              header: 'المبلغ',
              render: (row) => <strong>{formatMoney(Number(row.amount))}</strong>,
            },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={withdrawalVariant(String(row.status))}>
                  {withdrawalLabels[String(row.status)] || String(row.status)}
                </Badge>
              ),
            },
            { key: 'bankName', header: 'البنك', render: (row) => String(row.bankName || '—') },
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

      <Card>
        <div className="section-heading">
          <h2>آخر المبيعات</h2>
          <span className="muted-count">{stats.salesCount} عملية</span>
        </div>
        <Table
          data={data?.recentTransactions || []}
          emptyTitle="لا توجد عمليات"
          emptyDescription="ستظهر المبيعات هنا عند اشتراك الطلاب."
          columns={[
            { key: 'course', header: 'الكورس', render: (row) => String((row.course as any)?.titleAr || '—') },
            { key: 'user', header: 'الطالب', render: (row) => String((row.user as any)?.fullName || '—') },
            {
              key: 'finalAmount',
              header: 'المبلغ',
              render: (row) => formatMoney(Number(row.finalAmount)),
            },
            {
              key: 'net',
              header: 'صافي ربحك',
              render: (row) => formatMoney(roundMoney(Number(row.finalAmount) * (1 - commission))),
            },
            {
              key: 'createdAt',
              header: 'التاريخ',
              render: (row) => fmtDate(String(row.createdAt)),
            },
          ]}
        />
      </Card>

      <Modal isOpen={open} title="طلب سحب" onClose={() => !submitting && setOpen(false)}>
        <div className="withdraw-modal-summary">
          <div>
            <span>الرصيد المتاح</span>
            <strong>{formatMoney(available)}</strong>
          </div>
          {hasPending ? (
            <p className="field-helper">لديك طلب سحب قيد المراجعة — انتظر حتى يُعالج قبل طلب جديد.</p>
          ) : null}
        </div>
        <form className="stack-sm withdraw-modal-form" onSubmit={withdraw}>
          <Input
            label="المبلغ (ر.س)"
            type="number"
            min={1}
            max={available}
            step="0.01"
            value={form.amount}
            helper={`الحد الأقصى: ${formatMoney(available)}`}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            required
          />
          <Input
            label="البنك"
            value={form.bankName}
            placeholder="مثال: الراجحي"
            onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            required
          />
          <Input
            label="اسم الحساب"
            value={form.accountName}
            onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            required
          />
          <Input
            label="IBAN"
            value={form.iban}
            placeholder="SA..."
            dir="ltr"
            onChange={(e) => setForm({ ...form, iban: e.target.value.toUpperCase() })}
            required
          />
          <Textarea
            label="ملاحظات (اختياري)"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div className="modal-actions">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={submitting}>
              إلغاء
            </Button>
            <Button type="submit" loading={submitting} disabled={available <= 0 || hasPending}>
              إرسال الطلب
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={Boolean(selected)} title="تفاصيل طلب السحب" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>المبلغ</span><strong>{formatMoney(selected.amount)}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={withdrawalVariant(selected.status)}>{withdrawalLabels[selected.status]}</Badge>
            </div>
            <div className="detail-row"><span>البنك</span><strong>{selected.bankName || '—'}</strong></div>
            <div className="detail-row"><span>اسم الحساب</span><strong>{selected.accountName || '—'}</strong></div>
            <div className="detail-row"><span>IBAN</span><strong dir="ltr">{selected.iban || '—'}</strong></div>
            <div className="detail-row"><span>التاريخ</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            {selected.notes ? (
              <div className="detail-row"><span>ملاحظات</span><strong>{selected.notes}</strong></div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
