import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Download, FolderTree, Layers, Plus } from '@/icons';
import { adminApi } from '../../api/admin';
import { CategoriesTable } from '../../components/admin/categories/CategoriesTable';
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
import { useAdminCategoryLabels } from '../../hooks/useAdminCategoryLabels';
import { exportTableToExcel } from '../../utils/exportExcel';

export default function AdminCategoriesPage() {
  const { t } = useTranslation(['categories', 'common']);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { statusLabels, fmtDate, empty } = useAdminCategoryLabels();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyCategoryForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const exportColumns = useMemo(() => {
    const cols = t('admin.categories.export.columns', { returnObjects: true }) as Record<string, string>;
    return [
      { key: 'id', header: cols.id },
      { key: 'nameAr', header: cols.nameAr },
      { key: 'nameEn', header: cols.nameEn },
      { key: 'slug', header: cols.slug },
      { key: 'icon', header: cols.icon },
      { key: 'courses', header: cols.courses },
      { key: 'status', header: cols.status },
      { key: 'createdAt', header: cols.createdAt },
    ];
  }, [t]);

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
  }, [items, statusLabels]);

  const tableRows = useMemo(() => filteredItems.map((row) => ({
    id: row.id,
    nameAr: row.nameAr,
    nameEn: row.nameEn || empty,
    slug: row.slug,
    icon: row.icon || empty,
    courses: String(row._count?.courses ?? 0),
    status: statusLabels[row.status] || row.status,
    createdAt: fmtDate(row.createdAt),
    _raw: row,
  })), [filteredItems, statusLabels, fmtDate, empty]);

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
        showToast(t('admin.categories.toast.updated'), 'success');
      } else {
        await adminApi.createCategory(payload);
        showToast(t('admin.categories.toast.created'), 'success');
      }
      setFormOpen(false);
      setEditing(null);
      setForm(emptyCategoryForm);
      await load();
    } catch {
      showToast(t('admin.categories.toast.saveError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (category: any) => {
    const next = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await adminApi.categoryStatus(category.id, next);
    showToast(
      next === 'ACTIVE' ? t('admin.categories.toast.activated') : t('admin.categories.toast.deactivated'),
      'success',
    );
    await load();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteCategory(deleteTarget.id);
      showToast(t('admin.categories.toast.deleted'), 'success');
      setDeleteTarget(null);
      await load();
    } catch {
      showToast(t('admin.categories.toast.deleteError'), 'error');
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    exportTableToExcel(
      t('admin.categories.export.sheetName'),
      exportColumns,
      tableRows.map(({ _raw, ...row }) => row),
    );
  };

  return (
    <div className="page-grid admin-categories-page">
      <div className="reports-header">
        <PageHeader title={t('admin.categories.title')} subtitle={t('admin.categories.subtitle')} />
        <div className="reports-header-actions">
          <Button variant="outline" icon={<Download size={18} />} onClick={handleExport} disabled={!items.length}>
            {t('actions.exportExcel')}
          </Button>
          <Button icon={<Plus size={18} />} onClick={openCreate}>
            {t('admin.categories.addCategory')}
          </Button>
        </div>
      </div>

      <div className="stats-grid admin-categories-stats">
        <StatCard title={t('admin.categories.stats.total')} value={String(stats.total)} icon={FolderTree} />
        <StatCard title={t('admin.categories.stats.active')} value={String(stats.active)} icon={Layers} />
        <StatCard title={t('admin.categories.stats.inactive')} value={String(stats.inactive)} icon={FolderTree} />
        <StatCard title={t('admin.categories.stats.totalCourses')} value={String(stats.courses)} icon={BookOpen} />
      </div>

      <div className="reports-charts-grid">
        <ReportChart title={t('admin.categories.charts.statusDistribution')} type="pie" data={statusChart} />
      </div>

      <FilterBar
        searchValue={search}
        searchPlaceholder={t('admin.categories.filters.searchPlaceholder')}
        onSearchChange={setSearch}
        onReset={() => { setSearch(''); setStatusFilter(''); }}
      >
        <Select
          label={t('admin.categories.filters.status')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { label: t('admin.categories.filters.allStatuses'), value: '' },
            { label: statusLabels.ACTIVE, value: 'ACTIVE' },
            { label: statusLabels.INACTIVE, value: 'INACTIVE' },
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
        title={t('admin.categories.deleteTitle')}
        message={t('admin.categories.deleteMessage', { name: deleteTarget?.nameAr })}
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
