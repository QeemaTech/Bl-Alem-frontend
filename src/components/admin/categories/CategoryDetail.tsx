import { CheckCircle2, Pencil, Shield, Trash2 } from '@/icons';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { CategoryIcon } from './CategoryIcon';
import { fmtCategoryDate, statusLabels, statusVariant } from './categoryShared';

interface CategoryDetailProps {
  category: any;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
  deleteDisabled?: boolean;
  submitting?: boolean;
}

export function CategoryDetail({
  category,
  onEdit,
  onToggleStatus,
  onDelete,
  deleteDisabled,
  submitting,
}: CategoryDetailProps) {
  const courseCount = category._count?.courses ?? category.courses?.length ?? 0;

  return (
    <div className="support-ticket-detail admin-category-detail">
      <div className="support-ticket-detail-header">
        <div className="admin-category-detail-heading">
          <span className="support-ticket-id">#{category.id}</span>
          <div className="admin-category-title-row">
            <CategoryIcon icon={category.icon} size={28} filled className="admin-category-detail-icon" />
            <h2>{category.nameAr}</h2>
          </div>
          {category.nameEn ? <p className="admin-category-subtitle">{category.nameEn}</p> : null}
        </div>
        <Badge
          variant={statusVariant(category.status)}
          dot
          className="status-badge"
        >
          {statusLabels[category.status] || category.status}
        </Badge>
      </div>

      <div className="admin-category-meta">
        <div className="detail-row">
          <span>الرابط (slug)</span>
          <strong dir="ltr">{category.slug}</strong>
        </div>
        <div className="detail-row">
          <span>عدد الكورسات</span>
          <strong>{courseCount}</strong>
        </div>
        <div className="detail-row">
          <span>الأيقونة</span>
          <strong className="admin-category-icon-label">
            <CategoryIcon icon={category.icon} size={18} />
            {category.icon || '—'}
          </strong>
        </div>
        {category.image ? (
          <div className="detail-row">
            <span>الصورة</span>
            <strong dir="ltr" className="admin-category-image-url">{category.image}</strong>
          </div>
        ) : null}
        <div className="detail-row">
          <span>تاريخ الإنشاء</span>
          <strong>{fmtCategoryDate(category.createdAt)}</strong>
        </div>
        <div className="detail-row">
          <span>آخر تحديث</span>
          <strong>{fmtCategoryDate(category.updatedAt)}</strong>
        </div>
      </div>

      <div className="admin-category-detail-actions">
        <Button variant="ghost" size="sm" icon={<Pencil size={16} />} onClick={onEdit} disabled={submitting}>
          تعديل
        </Button>
        {category.status === 'ACTIVE' ? (
          <Button variant="secondary" size="sm" icon={<Shield size={16} />} onClick={onToggleStatus} disabled={submitting}>
            إيقاف
          </Button>
        ) : (
          <Button variant="secondary" size="sm" icon={<CheckCircle2 size={16} />} onClick={onToggleStatus} disabled={submitting}>
            تفعيل
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          icon={<Trash2 size={16} />}
          onClick={onDelete}
          disabled={deleteDisabled || submitting}
        >
          حذف
        </Button>
      </div>
    </div>
  );
}
