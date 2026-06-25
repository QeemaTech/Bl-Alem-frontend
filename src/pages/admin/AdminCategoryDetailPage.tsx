import { FormEvent, useEffect, useState } from 'react';
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
      showToast('تعذّر تحميل التصنيف.', 'error');
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
      showToast('تم تحديث التصنيف.', 'success');
      setFormOpen(false);
      await load();
    } catch {
      showToast('تعذّر حفظ التصنيف.', 'error');
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
      showToast(next === 'ACTIVE' ? 'تم تفعيل التصنيف.' : 'تم إيقاف التصنيف.', 'success');
      await load();
    } catch {
      showToast('تعذّر تحديث الحالة.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      await adminApi.deleteCategory(category.id);
      showToast('تم حذف التصنيف.', 'success');
      navigate('/admin/categories');
    } catch {
      showToast('لا يمكن حذف تصنيف مرتبط بدورات.', 'error');
      setDeleteOpen(false);
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (!category) {
    return (
      <div className="page-grid admin-category-detail-page">
        <EmptyState
          title="التصنيف غير موجود"
          description="لم نتمكن من العثور على هذا التصنيف."
        />
        <Button variant="outline" onClick={() => navigate('/admin/categories')}>
          العودة للتصنيفات
        </Button>
      </div>
    );
  }

  const courseCount = category._count?.courses ?? category.courses?.length ?? 0;

  return (
    <div className="page-grid admin-category-detail-page">
      <Link to="/admin/categories" className="support-ticket-back">
        <ArrowRight size={18} aria-hidden="true" />
        العودة للتصنيفات
      </Link>

      <Card className="support-ticket-page-card">
        <CategoryDetail
          category={category}
          onEdit={openEdit}
          onToggleStatus={toggleStatus}
          onDelete={() => setDeleteOpen(true)}
          deleteDisabled={courseCount > 0}
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
        title="حذف التصنيف"
        message={`هل أنت متأكد من حذف تصنيف "${category.nameAr}"؟`}
        confirmLabel="حذف"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
