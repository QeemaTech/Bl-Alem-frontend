import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Wallet, XCircle } from 'lucide-react';
import { adminApi } from '../../api/admin';
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
import { Textarea } from '../../components/ui/Textarea';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمد',
  PAID: 'مدفوع',
  REJECTED: 'مرفوض',
};

const statusVariant = (status: string) => {
  if (status === 'PAID' || status === 'APPROVED') return 'success' as const;
  if (status === 'PENDING') return 'pending' as const;
  if (status === 'REJECTED') return 'rejected' as const;
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
  { key: 'id', header: 'رقم الطلب' },
  { key: 'instructor', header: 'المحاضر' },
  { key: 'email', header: 'البريد' },
  { key: 'amount', header: 'المبلغ (ر.س)' },
  { key: 'bankName', header: 'البنك' },
  { key: 'accountName', header: 'اسم الحساب' },
  { key: 'iban', header: 'IBAN' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الطلب' },
  { key: 'notes', header: 'ملاحظات' },
];

export default function AdminWithdrawalsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<null | 'approve' | 'paid'>(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.withdrawals());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.instructor?.fullName, i.instructor?.email, i.bankName, i.accountName, i.iban, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => {
    const sum = (list: any[]) => list.reduce((acc, item) => acc + Number(item.amount || 0), 0);
    const pending = items.filter((i) => i.status === 'PENDING');
    const approved = items.filter((i) => i.status === 'APPROVED');
    const paid = items.filter((i) => i.status === 'PAID');
    const rejected = items.filter((i) => i.status === 'REJECTED');
    return {
      total: items.length,
      pendingCount: pending.length,
      pendingAmount: sum(pending),
      approvedCount: approved.length,
      paidCount: paid.length,
      paidAmount: sum(paid),
      rejectedCount: rejected.length,
    };
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    instructor: row.instructor?.fullName || '—',
    email: row.instructor?.email || '—',
    amount: `${Number(row.amount).toLocaleString('ar-SA')} ر.س`,
    bankName: row.bankName || '—',
    accountName: row.accountName || '—',
    iban: row.iban || '—',
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    notes: row.notes || '—',
    _raw: row,
  })), [filteredItems]);

  const handleExport = () => {
    exportTableToExcel(
      'السحوبات',
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  const handleApprove = async () => {
    if (!selected) return;
    await adminApi.approveWithdrawal(selected.id);
    showToast('تم اعتماد طلب السحب.', 'success');
    setConfirmAction(null);
    setSelected(null);
    load();
  };

  const handlePaid = async () => {
    if (!selected) return;
    await adminApi.markWithdrawalPaid(selected.id);
    showToast('تم تأكيد الدفع للمحاضر.', 'success');
    setConfirmAction(null);
    setSelected(null);
    load();
  };

  const handleReject = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    await adminApi.rejectWithdrawal(selected.id, rejectNotes || undefined);
    showToast('تم رفض طلب السحب.', 'success');
    setRejectOpen(false);
    setRejectNotes('');
    setSelected(null);
    load();
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="السحوبات"
          subtitle="مراجعة واعتماد طلبات سحب أرباح المحاضرين"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
          تصدير Excel
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الطلبات" value={String(stats.total)} icon={Wallet} />
        <StatCard
          title="قيد المراجعة"
          value={`${stats.pendingCount} (${stats.pendingAmount.toLocaleString('ar-SA')} ر.س)`}
          icon={Clock}
        />
        <StatCard title="معتمدة (بانتظار الدفع)" value={String(stats.approvedCount)} icon={CheckCircle2} />
        <StatCard
          title="مدفوعة"
          value={`${stats.paidCount} (${stats.paidAmount.toLocaleString('ar-SA')} ر.س)`}
          icon={CheckCircle2}
        />
        <StatCard title="مرفوضة" value={String(stats.rejectedCount)} icon={XCircle} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالمحاضر، البريد، البنك، أو IBAN..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'قيد المراجعة', value: 'PENDING' },
            { label: 'معتمد', value: 'APPROVED' },
            { label: 'مدفوع', value: 'PAID' },
            { label: 'مرفوض', value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد طلبات سحب"
          emptyDescription="لم يتم إرسال أي طلبات سحب من المحاضرين بعد."
          columns={[
            { key: 'id', header: 'رقم الطلب' },
            { key: 'instructor', header: 'المحاضر' },
            { key: 'email', header: 'البريد' },
            { key: 'amount', header: 'المبلغ' },
            { key: 'bankName', header: 'البنك' },
            { key: 'accountName', header: 'اسم الحساب' },
            { key: 'iban', header: 'IBAN' },
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
                const item = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => { setSelected(item); setDetailOpen(true); }}>
                      التفاصيل
                    </Button>
                    {item.status === 'PENDING' ? (
                      <>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => { setSelected(item); setConfirmAction('approve'); }}
                        >
                          اعتماد
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setSelected(item); setRejectOpen(true); }}
                        >
                          رفض
                        </Button>
                      </>
                    ) : null}
                    {item.status === 'APPROVED' ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => { setSelected(item); setConfirmAction('paid'); }}
                        >
                          تأكيد الدفع
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => { setSelected(item); setRejectOpen(true); }}
                        >
                          رفض
                        </Button>
                      </>
                    ) : null}
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal isOpen={detailOpen} title="تفاصيل طلب السحب" onClose={() => { setDetailOpen(false); setSelected(null); }}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم الطلب</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>المحاضر</span><strong>{selected.instructor?.fullName}</strong></div>
            <div className="detail-row"><span>البريد</span><strong>{selected.instructor?.email}</strong></div>
            <div className="detail-row"><span>الهاتف</span><strong>{selected.instructor?.phone || '—'}</strong></div>
            <div className="detail-row"><span>المبلغ</span><strong>{Number(selected.amount).toLocaleString('ar-SA')} ر.س</strong></div>
            <div className="detail-row"><span>البنك</span><strong>{selected.bankName || '—'}</strong></div>
            <div className="detail-row"><span>اسم الحساب</span><strong>{selected.accountName || '—'}</strong></div>
            <div className="detail-row"><span>IBAN</span><strong dir="ltr">{selected.iban || '—'}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>{statusLabels[selected.status]}</Badge>
            </div>
            <div className="detail-row"><span>تاريخ الطلب</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            {selected.notes ? (
              <div className="detail-row"><span>ملاحظات</span><strong>{selected.notes}</strong></div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal isOpen={rejectOpen} title="رفض طلب السحب" onClose={() => { setRejectOpen(false); setRejectNotes(''); setSelected(null); }}>
        <form className="stack-sm" onSubmit={handleReject}>
          <p>
            هل أنت متأكد من رفض طلب سحب بمبلغ{' '}
            <strong>{Number(selected?.amount || 0).toLocaleString('ar-SA')} ر.س</strong> للمحاضر{' '}
            <strong>{selected?.instructor?.fullName}</strong>؟
          </p>
          <Textarea
            label="سبب الرفض (اختياري)"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="اكتب سبب الرفض ليظهر للمحاضر..."
          />
          <Button variant="danger">تأكيد الرفض</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmAction === 'approve'}
        title="اعتماد طلب السحب"
        message={`هل تريد اعتماد طلب سحب بمبلغ ${Number(selected?.amount || 0).toLocaleString('ar-SA')} ر.س للمحاضر ${selected?.instructor?.fullName}؟`}
        confirmLabel="اعتماد"
        onConfirm={handleApprove}
        onCancel={() => { setConfirmAction(null); setSelected(null); }}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'paid'}
        title="تأكيد الدفع"
        message={`هل تم تحويل مبلغ ${Number(selected?.amount || 0).toLocaleString('ar-SA')} ر.س إلى حساب المحاضر ${selected?.instructor?.fullName}؟`}
        confirmLabel="تم الدفع"
        onConfirm={handlePaid}
        onCancel={() => { setConfirmAction(null); setSelected(null); }}
      />
    </div>
  );
}
