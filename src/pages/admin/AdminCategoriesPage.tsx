import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, FolderTree, Layers, Plus } from '@/icons';
import { adminApi } from '../../api/admin';
import { buildCategoryTableRows, CategoriesTable } from '../../components/admin/categories/CategoriesTable';
import { CategoryFormModal } from '../../components/admin/categories/CategoryFormModal';
import { emptyCategoryForm } from '../../components/admin/categories/categoryShared';
import { ReportChart } from '../../components/reports/ReportChart';
import { Button } from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { FilterBar } from '../../components/ui/FilterBar';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { StatCard } from '../../components/ui/StatCard';
import { useToast } from '../../components/ui/Toast';
import { exportTableToExcel } from '../../utils/exportExcel';
import { statusLabels } from '../../components/admin/categories/categoryShared';

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
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyCategoryForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

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

  const tableRows = useMemo(() => buildCategoryTableRows(filteredItems), [filteredItems]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyCategoryForm);
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
    navigate(`/admin/categories/${category.id}`);
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
      setForm(emptyCategoryForm);
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
    <div className="page-grid admin-categories-page">
      <div className="reports-header">
        <PageHeader title="التصنيفات" subtitle="إدارة تصنيفات الدورات على المنصة" />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            تصدير Excel
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            إضافة تصنيف
          </Button>
        </div>
      </div>

      <div className="stats-grid admin-categories-stats">
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

      <CategoriesTable
        items={tableRows}
        loading={loading}
        onDetail={openDetail}
        onEdit={openEdit}
        onToggleStatus={toggleStatus}
        onDelete={setDeleteTarget}
      />

      <CategoryFormModal
        isOpen={formOpen}
        editing={editing}
        form={form}
        submitting={submitting}
        onClose={() => { setFormOpen(false); setEditing(null); setForm(emptyCategoryForm); }}
        onChange={setForm}
        onSubmit={saveCategory}
      />

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
