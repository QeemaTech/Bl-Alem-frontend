import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Download, Gift, Plus, Tag } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { Table } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';

const statusLabels: Record<string, string> = {
  ACTIVE: 'فعّال',
  INACTIVE: 'غير فعّال',
  EXPIRED: 'منتهي',
};

const typeLabels: Record<string, string> = {
  PERCENTAGE: 'نسبة مئوية',
  FIXED: 'مبلغ ثابت',
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  if (status === 'EXPIRED') return 'rejected' as const;
  return 'default' as const;
};

const fmtDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('ar-SA') : '—');

const formatValue = (type: string, value: number) =>
  (type === 'PERCENTAGE' ? `${value}%` : `${value} ر.س`);

const emptyForm = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  maxUses: '',
  expiresAt: '',
  status: 'ACTIVE',
};

const exportColumns = [
  { key: 'code', header: 'الكود' },
  { key: 'type', header: 'النوع' },
  { key: 'value', header: 'القيمة' },
  { key: 'maxUses', header: 'الحد الأقصى للاستخدام' },
  { key: 'usedCount', header: 'مرات الاستخدام' },
  { key: 'expiresAt', header: 'تاريخ الانتهاء' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
];

export default function AdminCouponsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.coupons());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (typeFilter) result = result.filter((i) => i.type === typeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) => String(i.code || '').toLowerCase().includes(q));
    }
    return result;
  }, [items, statusFilter, typeFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    inactive: items.filter((i) => i.status === 'INACTIVE').length,
    expired: items.filter((i) => i.status === 'EXPIRED').length,
    totalUses: items.reduce((sum, i) => sum + Number(i.usedCount || 0), 0),
  }), [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    code: row.code,
    type: typeLabels[row.type] || row.type,
    value: formatValue(row.type, Number(row.value)),
    maxUses: row.maxUses ?? '∞',
    usedCount: String(row.usedCount ?? 0),
    expiresAt: fmtDate(row.expiresAt),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (coupon: any) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().slice(0, 10) : '',
      status: coupon.status,
    });
    setFormOpen(true);
  };

  const saveCoupon = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: Number(form.value),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        expiresAt: form.expiresAt || null,
        status: form.status,
      };
      if (editing) {
        await adminApi.updateCoupon(editing.id, payload);
        showToast('تم تحديث الكوبون.', 'success');
      } else {
        await adminApi.createCoupon(payload);
        showToast('تم إنشاء الكوبون.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (coupon: any) => {
    const next = coupon.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await adminApi.couponStatus(coupon.id, next);
    showToast(next === 'ACTIVE' ? 'تم تفعيل الكوبون.' : 'تم إيقاف الكوبون.', 'success');
    load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await adminApi.deleteCoupon(deleteTarget.id);
    showToast('تم حذف الكوبون.', 'success');
    setDeleteTarget(null);
    load();
  };

  const handleExport = () => {
    exportTableToExcel('الكوبونات', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="الكوبونات" subtitle="إدارة أكواد الخصم والعروض الترويجية" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة كوبون
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي الكوبونات" value={String(stats.total)} icon={Tag} />
        <StatCard title="فعّالة" value={String(stats.active)} icon={Gift} />
        <StatCard title="غير فعّالة" value={String(stats.inactive)} icon={Tag} />
        <StatCard title="منتهية" value={String(stats.expired)} icon={Tag} />
        <StatCard title="إجمالي الاستخدامات" value={String(stats.totalUses)} icon={Gift} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بكود الكوبون..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); setTypeFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'فعّال', value: 'ACTIVE' },
            { label: 'غير فعّال', value: 'INACTIVE' },
            { label: 'منتهي', value: 'EXPIRED' },
          ]}
        />
        <Select
          label="النوع"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          options={[
            { label: 'كل الأنواع', value: '' },
            { label: 'نسبة مئوية', value: 'PERCENTAGE' },
            { label: 'مبلغ ثابت', value: 'FIXED' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد كوبونات"
          emptyDescription="أضف كوبون خصم جديد للمنصة."
          columns={[
            { key: 'code', header: 'الكود' },
            { key: 'type', header: 'النوع' },
            { key: 'value', header: 'القيمة' },
            { key: 'maxUses', header: 'الحد الأقصى' },
            { key: 'usedCount', header: 'الاستخدام' },
            { key: 'expiresAt', header: 'ينتهي في' },
            {
              key: 'status',
              header: 'الحالة',
              render: (row) => (
                <Badge variant={statusVariant(String(row._raw?.status))}>
                  {statusLabels[String(row._raw?.status)] || row.status}
                </Badge>
              ),
            },
            { key: 'createdAt', header: 'تاريخ الإنشاء' },
            {
              key: 'actions',
              header: 'الإجراءات',
              render: (row) => {
                const coupon = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                      تعديل
                    </Button>
                    {coupon.status !== 'EXPIRED' ? (
                      <Button variant="secondary" size="sm" onClick={() => toggleStatus(coupon)}>
                        {coupon.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                      </Button>
                    ) : null}
                    <Button variant="danger" size="sm" onClick={() => setDeleteTarget(coupon)}>
                      حذف
                    </Button>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل الكوبون' : 'إضافة كوبون'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveCoupon}>
          <Input
            label="كود الكوبون"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="BI20"
            required
            disabled={Boolean(editing)}
          />
          <Select
            label="نوع الخصم"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { label: 'نسبة مئوية (%)', value: 'PERCENTAGE' },
              { label: 'مبلغ ثابت (ر.س)', value: 'FIXED' },
            ]}
          />
          <Input
            label={form.type === 'PERCENTAGE' ? 'نسبة الخصم (%)' : 'قيمة الخصم (ر.س)'}
            type="number"
            min="1"
            value={form.value}
            onChange={(e) => setForm({ ...form, value: e.target.value })}
            required
          />
          <Input
            label="الحد الأقصى للاستخدام (اختياري)"
            type="number"
            min="1"
            value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
            placeholder="اتركه فارغاً لاستخدام غير محدود"
          />
          <Input
            label="تاريخ الانتهاء (اختياري)"
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
          <Select
            label="الحالة"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { label: 'فعّال', value: 'ACTIVE' },
              { label: 'غير فعّال', value: 'INACTIVE' },
            ]}
          />
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء الكوبون'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف الكوبون"
        message={`هل أنت متأكد من حذف كوبون "${deleteTarget?.code}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
