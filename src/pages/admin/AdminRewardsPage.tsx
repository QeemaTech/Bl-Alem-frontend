import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Download, Gift, XCircle } from '@/icons';
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
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  PENDING: 'قيد المراجعة',
  APPROVED: 'معتمدة',
  REJECTED: 'مرفوضة',
};

const statusVariant = (status: string) => {
  if (status === 'APPROVED') return 'success' as const;
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
  { key: 'id', header: 'رقم الإحالة' },
  { key: 'referrer', header: 'المُحيل' },
  { key: 'referrerEmail', header: 'بريد المُحيل' },
  { key: 'referredUser', header: 'المدعو' },
  { key: 'referredEmail', header: 'بريد المدعو' },
  { key: 'code', header: 'كود الإحالة' },
  { key: 'rewardAmount', header: 'قيمة المكافأة (ر.س)' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإحالة' },
];

export default function AdminRewardsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [rewardAmount, setRewardAmount] = useState(50);
  const [selected, setSelected] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<null | 'approve' | 'reject'>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [rewards, settings] = await Promise.all([
      adminApi.rewards(),
      adminApi.settings(),
    ]);
    setItems(rewards);
    const amountSetting = settings.find((s: any) => s.key === 'referralRewardAmount');
    if (amountSetting) setRewardAmount(Number(amountSetting.value));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.rewardStatus === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.code, i.referrer?.fullName, i.referrer?.email, i.referredUser?.fullName, i.referredUser?.email, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => {
    const pending = items.filter((i) => i.rewardStatus === 'PENDING');
    const approved = items.filter((i) => i.rewardStatus === 'APPROVED');
    const rejected = items.filter((i) => i.rewardStatus === 'REJECTED');
    return {
      total: items.length,
      pending: pending.length,
      approved: approved.length,
      rejected: rejected.length,
      totalPaid: approved.length * rewardAmount,
    };
  }, [items, rewardAmount]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    referrer: row.referrer?.fullName || '—',
    referrerEmail: row.referrer?.email || '—',
    referredUser: row.referredUser?.fullName || '—',
    referredEmail: row.referredUser?.email || '—',
    code: row.code,
    rewardAmount: row.rewardStatus === 'APPROVED' ? `${rewardAmount} ر.س` : '—',
    status: statusLabels[row.rewardStatus] || row.rewardStatus,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, rewardAmount]);

  const updateStatus = async (status: string) => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await adminApi.rewardStatus(selected.id, status);
      showToast(status === 'APPROVED' ? 'تم اعتماد المكافأة وإضافتها لمحفظة المُحيل.' : 'تم رفض المكافأة.', 'success');
      setConfirmAction(null);
      setSelected(null);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      'المكافآت والإحالات',
      exportColumns,
      tableRows.map(({ _raw, ...row }) => ({
        ...row,
        rewardAmount: _raw.rewardStatus === 'APPROVED' ? rewardAmount : 0,
      })),
    );
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader
          title="المكافآت والإحالات"
          subtitle="مراجعة إحالات الطلاب واعتماد المكافآت"
        />
        <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
          تصدير Excel
        </Button>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الإحالات" value={String(stats.total)} icon={Gift} />
        <StatCard title="قيد المراجعة" value={String(stats.pending)} icon={Clock} />
        <StatCard title="معتمدة" value={String(stats.approved)} icon={CheckCircle2} />
        <StatCard title="مرفوضة" value={String(stats.rejected)} icon={XCircle} />
        <StatCard title="إجمالي المكافآت المدفوعة" value={`${stats.totalPaid.toLocaleString('ar-SA')} ر.س`} icon={Gift} />
      </div>

      <Card className="admin-reward-info">
        <p>قيمة المكافأة لكل إحالة معتمدة: <strong>{rewardAmount} ر.س</strong> — تُضاف تلقائياً لمحفظة المُحيل عند الاعتماد.</p>
      </Card>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالكود، المُحيل، المدعو، أو البريد..."
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
            { label: 'معتمدة', value: 'APPROVED' },
            { label: 'مرفوضة', value: 'REJECTED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد إحالات"
          emptyDescription="لم يتم تسجيل أي إحالات بعد."
          columns={[
            { key: 'id', header: 'رقم الإحالة' },
            { key: 'referrer', header: 'المُحيل' },
            { key: 'referredUser', header: 'المدعو' },
            { key: 'code', header: 'كود الإحالة' },
            { key: 'rewardAmount', header: 'المكافأة' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.rewardStatus))}>
                  {statusLabels[String(row._raw?.rewardStatus)] || row.status}
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
                    <Button variant="ghost" size="sm" onClick={() => setSelected(item)}>
                      التفاصيل
                    </Button>
                    {item.rewardStatus === 'PENDING' ? (
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
                          onClick={() => { setSelected(item); setConfirmAction('reject'); }}
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

      <Modal isOpen={Boolean(selected) && !confirmAction} title="تفاصيل الإحالة" onClose={() => setSelected(null)}>
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم الإحالة</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>المُحيل</span><strong>{selected.referrer?.fullName}</strong></div>
            <div className="detail-row"><span>بريد المُحيل</span><strong>{selected.referrer?.email}</strong></div>
            <div className="detail-row"><span>المدعو</span><strong>{selected.referredUser?.fullName}</strong></div>
            <div className="detail-row"><span>بريد المدعو</span><strong>{selected.referredUser?.email}</strong></div>
            <div className="detail-row"><span>كود الإحالة</span><strong>{selected.code}</strong></div>
            <div className="detail-row"><span>قيمة المكافأة</span><strong>{rewardAmount} ر.س</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.rewardStatus)}>{statusLabels[selected.rewardStatus]}</Badge>
            </div>
            <div className="detail-row"><span>تاريخ الإحالة</span><strong>{fmtDate(selected.createdAt)}</strong></div>
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        isOpen={confirmAction === 'approve'}
        title="اعتماد المكافأة"
        message={`هل تريد اعتماد مكافأة ${rewardAmount} ر.س للمُحيل ${selected?.referrer?.fullName} عن إحالة ${selected?.referredUser?.fullName}؟ سيتم إضافة المبلغ لمحفظته.`}
        confirmLabel="اعتماد"
        onConfirm={() => updateStatus('APPROVED')}
        onCancel={() => { setConfirmAction(null); setSelected(null); }}
      />

      <ConfirmDialog
        isOpen={confirmAction === 'reject'}
        title="رفض المكافأة"
        message={`هل تريد رفض مكافأة الإحالة بين ${selected?.referrer?.fullName} و ${selected?.referredUser?.fullName}؟`}
        confirmLabel="رفض"
        onConfirm={() => updateStatus('REJECTED')}
        onCancel={() => { setConfirmAction(null); setSelected(null); }}
      />
    </div>
  );
}
