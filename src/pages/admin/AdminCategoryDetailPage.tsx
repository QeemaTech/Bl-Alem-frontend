import { FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight } from '@/icons';
import { adminApi } from '../../api/admin';
import { CategoryCoursesTable } from '../../components/admin/categories/CategoryCoursesTable';
import { CategoryDetail } from '../../components/admin/categories/CategoryDetail';
import { CategoryFormModal } from '../../components/admin/categories/CategoryFormModal';
import { emptyCategoryForm } from '../../components/admin/categories/categoryShared';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { DashboardSkeleton } from '../../components/ui/LoadingSkeleton';
import { useToast } from '../../components/ui/Toast';

export default function AdminCategoryDetailPage() {
  const { t } = useTranslation(['categories', 'common']);
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [category, setCategory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyCategoryForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      setCategory(await adminApi.category(categoryId));
    } catch {
      showToast(t('admin.categories.toast.loadError'), 'error');
      setCategory(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [categoryId]);

  const openEdit = () => {
    if (!category) return;
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

  const saveCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!category) return;
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
      await adminApi.updateCategory(category.id, payload);
      showToast(t('admin.categories.toast.updated'), 'success');
      setFormOpen(false);
      await load();
    } catch {
      showToast(t('admin.categories.toast.saveError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async () => {
    if (!category) return;
    setSubmitting(true);
    try {
      const next = category.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await adminApi.categoryStatus(category.id, next);
      showToast(
        next === 'ACTIVE' ? t('admin.categories.toast.activated') : t('admin.categories.toast.deactivated'),
        'success',
      );
      await load();
    } catch {
      showToast(t('admin.categories.toast.statusError'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      const result = await adminApi.deleteCategory(category.id);
      const reassigned = Number(result?.reassignedCourses || 0);
      if (reassigned > 0) {
        const fallbackName = result?.fallbackCategory?.nameAr || result?.fallbackCategory?.nameEn || '';
        showToast(t('admin.categories.toast.deletedWithReassign', { count: reassigned, fallback: fallbackName }), 'success');
      } else {
        showToast(t('admin.categories.toast.deleted'), 'success');
      }
      navigate('/admin/categories');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
        || t('admin.categories.toast.deleteError');
      showToast(message, 'error');
      setDeleteOpen(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!category) {
    return (
      <div className="page-grid admin-category-detail-page">
        <EmptyState
          title={t('admin.categories.notFound.title')}
          description={t('admin.categories.notFound.description')}
        />
        <Button variant="outline" onClick={() => navigate('/admin/categories')}>
          {t('admin.categories.backToCategories')}
        </Button>
      </div>
    );
  }

  const courseCount = category._count?.courses ?? category.courses?.length ?? 0;

  return (
    <div className="page-grid admin-category-detail-page">
      <Link to="/admin/categories" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        {t('admin.categories.backToCategories')}
      </Link>

      <Card className="support-ticket-page-card">
        <CategoryDetail
          category={category}
          onEdit={openEdit}
          onToggleStatus={toggleStatus}
          onDelete={() => setDeleteOpen(true)}
          submitting={submitting}
        />
      </Card>

      <CategoryCoursesTable courses={category.courses || []} />

      <CategoryFormModal
        isOpen={formOpen}
        editing={category}
        form={form}
        submitting={submitting}
        onClose={() => setFormOpen(false)}
        onChange={setForm}
        onSubmit={saveCategory}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title={t('admin.categories.deleteTitle')}
        message={
          courseCount > 0
            ? t('admin.categories.deleteMessageWithCourses', { name: category.nameAr, count: courseCount })
            : t('admin.categories.deleteMessage', { name: category.nameAr })
        }
        confirmLabel={t('common:actions.delete')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
