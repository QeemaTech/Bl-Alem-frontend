import { FormEvent, useEffect, useMemo, useState } from 'react';
import { BookOpen, Download, FolderTree, Layers, Plus } from '@/icons';
import { adminApi } from '../../api/admin';
import { ReportChart } from '../../components/reports/ReportChart';
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
};

const statusVariant = (status: string) => {
  if (status === 'ACTIVE') return 'success' as const;
  if (status === 'INACTIVE') return 'warning' as const;
  return 'default' as const;
};

const fmtDate = (value?: string | null) => (value
  ? new Date(value).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—');

const emptyForm = {
  nameAr: '',
  nameEn: '',
  slug: '',
  icon: '',
  image: '',
  status: 'ACTIVE',
};

const exportColumns = [
  { key: 'id', header: 'رقم التصنيف' },
  { key: 'nameAr', header: 'الاسم العربي' },
  { key: 'nameEn', header: 'الاسم الإنجليزي' },
  { key: 'slug', header: 'الرابط' },
  { key: 'icon', header: 'الأيقونة' },
  { key: 'courses', header: 'عدد الكورسات' },
  { key: 'status', header: 'الحالة' },
  { key: 'createdAt', header: 'تاريخ الإنشاء' },
];

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    setLoading(true);
    setItems(await adminApi.categories());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (statusFilter) result = result.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((i) =>
        [i.nameAr, i.nameEn, i.slug, i.icon, String(i.id)]
          .some((v) => String(v || '').toLowerCase().includes(q)),
      );
    }
    return result;
  }, [items, statusFilter, search]);

  const stats = useMemo(() => ({
    total: items.length,
    active: items.filter((i) => i.status === 'ACTIVE').length,
    inactive: items.filter((i) => i.status === 'INACTIVE').length,
    courses: items.reduce((sum, i) => sum + Number(i._count?.courses || 0), 0),
  }), [items]);

  const statusChart = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      const label = statusLabels[i.status] || i.status;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([label, value]) => ({ label, value }));
  }, [items]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn || '—',
    slug: row.slug,
    icon: row.icon || '—',
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (category: any) => {
    setEditing(category);
    setForm({
      nameAr: category.nameAr,
      nameEn: category.nameEn || '',
      slug: category.slug,
      icon: category.icon || '',
      image: category.image || '',
      status: category.status,
    });
    setFormOpen(true);
  };

  const openDetail = (category: any) => {
    setSelected(category);
    setDetailOpen(true);
  };

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || null,
        slug: form.slug.trim() || undefined,
        icon: form.icon.trim() || null,
        image: form.image.trim() || null,
        status: form.status,
      };
      if (editing) {
        await adminApi.updateCategory(editing.id, payload);
        showToast('تم تحديث التصنيف.', 'success');
      } else {
        await adminApi.createCategory(payload);
        showToast('تم إنشاء التصنيف.', 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyForm);
      await load();
    } catch {
      showToast('تعذّر حفظ التصنيف.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (category: any) => {
    const next = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await adminApi.categoryStatus(category.id, next);
    showToast(next === 'ACTIVE' ? 'تم تفعيل التصنيف.' : 'تم إيقاف التصنيف.', 'success');
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showToast('تم حذف التصنيف.', 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast('لا يمكن حذف تصنيف مرتبط بدورات.', 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel('التصنيفات', exportColumns, tableRows.map(({ _raw, ...row }) => row));
  };

  return (
    <div className="page-grid">
      <div className="reports-header">
        <PageHeader title="التصنيفات" subtitle="إدارة تصنيفات الدورات على المنصة" />
        <div className="chip-row">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة تصنيف
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="إجمالي التصنيفات" value={String(stats.total)} icon={FolderTree} />
        <StatCard title="فعّالة" value={String(stats.active)} icon={Layers} />
        <StatCard title="غير فعّالة" value={String(stats.inactive)} icon={FolderTree} />
        <StatCard title="إجمالي الكورسات" value={String(stats.courses)} icon={BookOpen} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title="توزيع حالات التصنيفات" type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder="بحث بالاسم أو الرابط..."
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label="الحالة"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'فعّال', value: 'ACTIVE' },
            { label: 'غير فعّال', value: 'INACTIVE' },
          ]}
        />
      </FilterBar>

      <Card>
        <Table
          loading={loading}
          data={tableRows}
          emptyTitle="لا توجد تصنيفات"
          emptyDescription="أضف تصنيفاً جديداً لتنظيم الدورات."
          columns={[
            { key: 'nameAr', header: 'الاسم العربي' },
            { key: 'nameEn', header: 'الاسم الإنجليزي' },
            { key: 'slug', header: 'الرابط' },
            { key: 'icon', header: 'الأيقونة' },
            { key: 'courses', header: 'الكورسات' },
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
                const category = row._raw;
                return (
                  <div className="card-actions">
                    <Button variant="ghost" size="sm" onClick={() => openDetail(category)}>
                      التفاصيل
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(category)}>
                      تعديل
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => toggleStatus(category)}>
                      {category.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(category)}
                      disabled={Number(category._count?.courses || 0) > 0}
                    >
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
        isOpen={detailOpen}
        title="تفاصيل التصنيف"
        onClose={() => { setDetailOpen(false); setSelected(null); }}
      >
        {selected ? (
          <div className="stack-sm withdrawal-detail">
            <div className="detail-row"><span>رقم التصنيف</span><strong>{selected.id}</strong></div>
            <div className="detail-row"><span>الاسم العربي</span><strong>{selected.nameAr}</strong></div>
            <div className="detail-row"><span>الاسم الإنجليزي</span><strong>{selected.nameEn || '—'}</strong></div>
            <div className="detail-row"><span>الرابط</span><strong dir="ltr">{selected.slug}</strong></div>
            <div className="detail-row"><span>الأيقونة</span><strong>{selected.icon || '—'}</strong></div>
            <div className="detail-row"><span>عدد الكورسات</span><strong>{selected._count?.courses ?? 0}</strong></div>
            <div className="detail-row">
              <span>الحالة</span>
              <Badge variant={statusVariant(selected.status)}>
                {statusLabels[selected.status] || selected.status}
              </Badge>
            </div>
            <div className="detail-row"><span>تاريخ الإنشاء</span><strong>{fmtDate(selected.createdAt)}</strong></div>
            <div className="detail-row"><span>آخر تحديث</span><strong>{fmtDate(selected.updatedAt)}</strong></div>
            <Button variant="ghost" onClick={() => { setDetailOpen(false); openEdit(selected); }}>
              تعديل التصنيف
            </Button>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={formOpen}
        title={editing ? 'تعديل التصنيف' : 'إضافة تصنيف'}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyForm); }}
      >
        <form className="stack-sm" onSubmit={saveCategory}>
          <Input
            label="الاسم العربي"
            value={form.nameAr}
            onChange={(e) => setForm({ ...form, nameAr: e.target.value })}
            required
          />
          <Input
            label="الاسم الإنجليزي"
            value={form.nameEn}
            onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
          />
          <Input
            label="الرابط (slug)"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="programming"
            dir="ltr"
            disabled={Boolean(editing)}
          />
          <Input
            label="الأيقونة"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="code"
          />
          <Input
            label="رابط الصورة (اختياري)"
            value={form.image}
            onChange={(e) => setForm({ ...form, image: e.target.value })}
            placeholder="https://..."
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
          <Button loading={submitting}>{editing ? 'حفظ التعديلات' : 'إنشاء التصنيف'}</Button>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="حذف التصنيف"
        message={`هل أنت متأكد من حذف تصنيف "${deleteTarget?.nameAr}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
